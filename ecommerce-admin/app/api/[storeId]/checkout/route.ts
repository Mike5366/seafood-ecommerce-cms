import Stripe from "stripe";
import { NextResponse } from "next/server";

import { stripe } from "@/lib/stripe";
import prismadb from "@/lib/prismadb";
import { OrderItem } from "@prisma/client";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT,DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(
  req: Request,
  { params }: { params: { storeId: string } }
) {
  const { items } = await req.json();

  if (!items || items.length === 0) {
    return new NextResponse("Product ids are required", { status: 400 });
  }

  for (let item of items) {
    const product = await prismadb.product.findFirst({
      where: {
        id: item.product.id,
      },
    });

    if (product && item.quantity > product.inventory) {
      return NextResponse.json(
        {
          message:
            "Checkout failed.\nOnly " +
            product?.inventory +
            " " +
            item.product.name +
            " left in stock",
          success: false,
        },
        { headers: corsHeaders }
      );
    }
  }

  const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

  items.forEach((item: any) => {
    line_items.push({
      quantity: item.quantity,
      price_data: {
        currency: "USD",
        product_data: {
          name: item.product.name,
        },
        unit_amount: item.product.price * 100,
      },
    });
  });

  const order = await prismadb.order.create({
    data: {
      storeId: params.storeId,
      isPaid: false,
      orderItems: {
        create: items.map((item: any) => ({
          product: {
            connect: {
              id: item.product.id,
            },
          },
          quantity: item.quantity,
        })),
      },
    },
  });

  const session = await stripe.checkout.sessions.create({
    line_items,
    mode: "payment",
    billing_address_collection: "required",
    phone_number_collection: {
      enabled: true,
    },
    success_url: `${process.env.FRONTEND_STORE_URL}/cart?success=1`,
    cancel_url: `${process.env.FRONTEND_STORE_URL}/cart?cancel=1`,
    metadata: {
      orderId: order.id,
    },
  });

  return NextResponse.json(
    { url: session.url, success: true },
    { headers: corsHeaders }
  );
}
