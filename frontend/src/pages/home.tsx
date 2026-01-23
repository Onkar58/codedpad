import React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";

export function Home() {
  const [value, setValue] = useState("");
  const navigate = useNavigate();

  const handleSubmit = () => {
    if (!value.trim()) return;
    navigate(`/${encodeURIComponent(value)}`);
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center font-display">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="flex flex-col items-center gap-6 px-6 text-center"
      >
        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-3xl font-semibold tracking-tight leading-[0]"
        >
          Enter pass code to access the secret pad
        </motion.h1>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-sm max-w-md"
        >
          If the secret code doesn’t exist, we’ll create a new secret pad for
          you.
        </motion.p>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col items-center gap-4 w-full max-w-sm"
        >
          <Input
            placeholder="e.g. dashboard, project-42"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="font-bold px-3 py-2"
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />

          <Button
            onClick={handleSubmit}
            variant="default"
            className="w-fit"
            disabled={!value.trim()}
          >
            Continue
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
