import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const BUTTON_SOLID =
  "bg-white text-black text-base font-medium rounded-lg transition duration-200 hover:bg-gray-100 disabled:opacity-60";
const INPUT_CLEAN =
  "w-full p-4 rounded-lg bg-black/40 text-white border border-white/20 placeholder-white/60 focus:ring-1 focus:ring-white focus:border-white transition";

const Header = () => (
  <div className="pt-10 w-full text-center z-10">
    <h1 className="text-white text-base font-semibold">Sundate</h1>
  </div>
);

export default function Verification() {
  const navigate = useNavigate();
  const [step, setStep] = useState("mobile");
  const [mobileNumber, setMobileNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [timer, setTimer] = useState(120);

  useEffect(() => {
    if (step === "otp" && timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [step, timer]);

  const handleSendOtp = () => {
    if (mobileNumber.length >= 10) {
      setTimer(120);
      setStep("otp");
    }
  };

  const handleVerifyOtp = () => {
    if (otp.length === 6) {
      setStep("success");
    }
  };

  const MobileStep = (
    <>
      <h2 className="text-white text-lg font-semibold mb-2">
        Verify your number
      </h2>
      <p className="text-white/80 text-sm mb-8">
        Let's get your number verified with an OTP
      </p>

      <input
        type="tel"
        value={mobileNumber}
        onChange={(e) => setMobileNumber(e.target.value)}
        placeholder="Enter Mobile number"
        className={INPUT_CLEAN + " mb-8"}
        maxLength={10}
      />

      <button
        onClick={handleSendOtp}
        className={BUTTON_SOLID + " w-full py-4"}
      >
        Next
      </button>
    </>
  );

  const OtpStep = (
    <>
      <h2 className="text-white text-lg font-semibold mb-2">
        Enter verification code
      </h2>
      <p className="text-white/80 text-sm mb-8">
        We sent a 6-digit code to{" "}
        <span className="font-medium text-white">
          +91 {mobileNumber || "9833540192"}
        </span>
      </p>

      <input
        type="number"
        value={otp}
        onChange={(e) => setOtp(e.target.value.slice(0, 6))}
        placeholder="------"
        className={INPUT_CLEAN + " text-center tracking-widest text-lg mb-6"}
      />

      <div className="w-full mb-10 text-left text-sm">
        {timer > 0 ? (
          <p className="text-white/70">
            Resend OTP in 0:{timer.toString().padStart(2, "0")}
          </p>
        ) : (
          <button
            onClick={handleSendOtp}
            className="text-white font-medium hover:text-white/80"
          >
            Resend OTP
          </button>
        )}
      </div>

      <button
        onClick={handleVerifyOtp}
        disabled={otp.length !== 6}
        className={BUTTON_SOLID + " w-full py-4"}
      >
        Next
      </button>
    </>
  );

const SuccessStep = (
  <div className="flex flex-col items-center text-center py-12">
    <div className="w-26 h-26 mb-6 flex items-center justify-center rounded-full bg-green-500/20">
      <img
        src="/verification-success.svg"
        alt="Success"
        className="w-26 h-26"
      />
    </div>
    <h2 className="text-white text-lg font-semibold mb-2">
      Verification successful
    </h2>
    <p className="text-white/80 text-sm mb-10">
      Start your application process
    </p>
    <button
      onClick={() => navigate("/login")}
      className={BUTTON_SOLID + " w-full py-4"}
    >
      Next
    </button>
  </div>
);


  let content;
  if (step === "mobile") content = MobileStep;
  else if (step === "otp") content = OtpStep;
  else content = SuccessStep;

  return (
    <div className="h-screen w-screen flex flex-col items-center relative px-6">
      {/* Background with blur */}
      <div
        className="absolute inset-0 bg-black/40 z-0"
        style={{
          backgroundImage: `url('/bgs/bg-verification.png')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(5px)",
        }}
      ></div>

      {/* Foreground overlay for readability */}
      <div className="absolute inset-0 bg-black/50 z-0"></div>

      <Header />

      {/* Content pinned to top, not middle */}
      <div className="relative z-10 w-full max-w-sm mt-12">
        {content}
      </div>
    </div>
  );
}
