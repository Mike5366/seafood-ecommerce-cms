"use client";

import { Modal } from "@/components/ui/modal";
import { useEffect, useState } from "react";

const SetupPage = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(true);
  },[]);
  

  return (
    <div className="p-4">
      <Modal title="Test" description="Test Desc" isOpen={open} onClose={() => {}}>
        Children
      </Modal>
    </div>
  );
};

export default SetupPage;
