"use client";
import React from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

export default function Loader() {
  return (
      <DotLottieReact
        src="https://lottie.host/a7387f17-5279-4d77-9535-21cad5f95569/mf6PaFvcin.lottie" // Ensure the file is inside /public
        loop
        autoplay
        style={{ width: "40px", height: "30px" }}
      />
  );
}
