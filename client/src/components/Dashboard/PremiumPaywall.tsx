import { useEffect, useId, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

export type PremiumPlan = "weekly" | "monthly" | "annual";
type Props = {
  open: boolean;
  onClose: () => void;
  onSubscribe?: (plan: PremiumPlan) => void | Promise<void>;
};

// const spectrum =
//   "linear-gradient(100deg,#129bff 0%,#a5a0ff 29%,#ff9fe5 52%,#ffbaa0 74%,#ffd000 100%)";

const spectrum =
  "linear-gradient(105deg,#6ab8ff 0%,#a6a6ff 28%,#ddb2f5 52%,#f8c0d8 75%,#ffe39a 100%)";


// const spectrum =
//   "linear-gradient(100deg,#155dfc 0%,#7187ff 26%,#c28de9 51%,#ff9fca 75%,#ffd45e 100%)";

// const spectrum   =
//   "linear-gradient(100deg,#42b6ff 0%,#8897ff 25%,#dba3ff 48%,#ffb4b6 72%,#ffc86b 100%)";


// const spectrum =
//   "linear-gradient(110deg,#4aa3ff 0%,#9d91f4 30%,#d5a7ee 53%,#ffb0c6 76%,#ffe08a 100%)";

// const spectrum =
//   "linear-gradient(100deg,#b9dcff 0%,#d0ceff 30%,#f1c8f0 54%,#ffd9cf 77%,#ffe9b0 100%)";

const plans = [
  {
    id: "weekly",
    name: "Weekly",
    price: 4.20,
    note: "*Billed weekly, cancel anytime. You can turn off auto-renew from your settings.",
  },
  {
    id: "annual",
    name: "Annual",
    price: 9.99,
    note: "*Billed as one payment. Renews annually, cancel anytime. You can turn off auto-renew from your settings.",
  },    
  {
    id: "monthly",
    name: "Monthly",
    price: 12.54,
    note: "*Billed monthly, cancel anytime. You can turn off auto-renew from your settings.",
  },
] as const;


function Mascot({ className = "" }: { className?: string }) {
  const id = useId();

  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <defs>

        <linearGradient id={id} x2=".8" y2="1">
          <stop stopColor="#ff9c16" />
          <stop offset="1" stopColor="#ff5c00" />
        </linearGradient>

      </defs>
      <rect x="12" y="12" width="72" height="76" rx="12" fill={`url(#${id})`} />
      <path
        d="M19 22Q45 12 75 20"
        fill="none"
        stroke="#ffb543"
        strokeWidth="4"
        opacity=".65"
      />
      <ellipse cx="38" cy="45" rx="10" ry="17" fill="white" />
      <ellipse cx="61" cy="45" rx="10" ry="17" fill="white" />
      <ellipse cx="41" cy="49" rx="5.5" ry="10" fill="#151515" />
      <ellipse cx="58" cy="49" rx="5.5" ry="10" fill="#151515" />
      <path
        d="M39 68Q50 80 62 66"
        fill="none"
        stroke="#402510"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

// function PremiumKey() {
//   const id = useId();
//   return (
//     <svg
//       viewBox="0 0 300 180"
//       className="h-[150px] w-[250px] sm:h-[175px] sm:w-[290px]"
//       aria-hidden="true"
//     >
//       <defs>
//         <linearGradient id={id}>
//           <stop stopColor="#008fff" />
//           <stop offset=".35" stopColor="#b18aff" />
//           <stop offset=".57" stopColor="#ffa5de" />
//           <stop offset=".78" stopColor="#ffc098" />
//           <stop offset="1" stopColor="#ffd617" />
//         </linearGradient>
//         <linearGradient id={`${id}-light`} x2="0" y2="1">
//           <stop stopColor="white" stopOpacity=".4" />
//           <stop offset="1" stopColor="white" stopOpacity="0" />
//         </linearGradient>
//       </defs>
//       <path
//         d="M53 49 74 35 128 39 143 64 163 64 180 38 217 35 235 72 219 98 225 132 201 142 181 135 171 112 138 113 125 139 72 139 46 94Z"
//         fill="#0679f4"
//       />
//       <path
//         d="M61 48 81 33 134 37 148 62 168 62 186 35 220 34 239 68 223 94 230 130 204 135 188 108 146 108 132 133 79 133 53 89Z M99 63 89 82 97 99 119 99 128 83 180 83 180 75 126 75 118 63Z"
//         fill={`url(#${id})`}
//         fillRule="evenodd"
//       />
//       <path
//         d="M61 48 81 33 134 37 148 62 168 62 186 35 220 34 229 58 186 60 175 79 128 79 118 63 99 63 89 82 61 90Z"
//         fill={`url(#${id}-light)`}
//       />
//       <path
//         d="m188 108 16 27 26-5-10-6-15 3-12-24M79 133l53 0 14-25-9-4-13 22-41 0"
//         fill="white"
//         opacity=".25"
//       />
//       {[
//         [34, 48, 15, "#0798ff"],
//         [81, 8, 12, "#f495ed"],
//         [230, 11, 11, "#ffc400"],
//         [258, 28, 10, "#ffc400"],
//         [220, 152, 8, "#ffb7af"],
//         [67, 147, 9, "#f7a3ee"],
//         [22, 98, 5, "#f7a3ee"],
//       ].map(([x, y, s, c], i) => (
//         <path
//           key={i}
//           transform={`translate(${x} ${y}) scale(${Number(s) / 10})`}
//           d="M0-10Q1-1 10 0Q1 1 0 10Q-1 1-10 0Q-1-1 0-10"
//           fill={String(c)}
//         />
//       ))}
//     </svg>
//   );
// }

function Status({ 
  included 
}: { included: boolean }) {

  return (
    <svg
      viewBox="0 0 28 28"
      className="mx-auto size-[26px]"
      role="img"
      aria-label={included ? "Included" : "Not included"}
    >
      <circle
        cx="14"
        cy="14"
        r={included ? 12 : 10}
        fill={included ? "#ffc48e" : "#777"}
      />

      <path
        d={included ? "m8 14 4 4 8-9" : "m9 9 10 10m0-10L9 19"}
        fill="none"
        stroke={included ? "#141414" : "white"}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const cta =
  `min-h-[52px] w-full max-w-[400px] rounded-full border-b-[4px] border-black active:border-b-0 select-none bg-[linear-gradient(110deg,#363636,#292929)]
   px-6 py-3 text-[16px] font-semibold text-white transition-[transform,filter] hover:brightness-110 active:translate-y-[3px]
    disabled:cursor-wait disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600`;

export default function PremiumPaywall({ open, onClose, onSubscribe }: Props) {

  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const reduceMotion = useReducedMotion();
  const [step, setStep] = useState<"benefits" | "plans">("benefits");
  const [selected, setSelected] = useState<PremiumPlan>("monthly");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const attempt = useRef(0);

  useEffect(() => {
    if (!open || !ref.current) return;
    const dialog = ref.current;
    const previousFocus = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;

    setStep("benefits");
    setSelected("monthly");
    setMessage("");
    setBusy(false);

    dialog.showModal();
    document.body.style.overflow = "hidden";

    return () => {
      attempt.current++;
      dialog.close();
      document.body.style.overflow = overflow;
      previousFocus?.focus();
    };
  }, [open]);

  async function subscribe() {
    if (busy) return;

    if (!onSubscribe) {
      setMessage("Checkout is not connected yet. No payment has been taken.");
      return;
    }

    const current = ++attempt.current;
    setBusy(true);
    setMessage("");

    try {
      await onSubscribe(selected);
    } catch {
      if (attempt.current === current)
        setMessage("Could not open checkout. Please try again.");
    } finally {
      if (attempt.current === current) setBusy(false);
    }
  }

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onClose();
      }}
      className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none overflow-y-auto border-0 bg-white p-0 text-[#111]
       backdrop:bg-white "
    >

      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[35vh]"
        style={{
          background:
            "linear-gradient(to bottom,transparent,white),linear-gradient(110deg,#c7e3ff 0%,#fbe1fa 35%,#fff0e1 65%,#fff5bc 100%)",
        }}
      />

      <button
        type="button"
        onClick={onClose}
        disabled={busy}
        aria-label="Close premium"
        autoFocus
        className="absolute right-3 top-3 z-20 grid size-10 place-items-center rounded-full text-[#626262] hover:bg-black/5
         focus-visible:outline-2 focus-visible:outline-blue-600"
      >

        <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
          <path
            d="m6 6 12 12M6 18 18 6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>

      </button>

      {step === "plans" && (
        <button
          type="button"
          onClick={() => {
            setStep("benefits");
            setMessage("");
          }}
          disabled={busy}
          className="absolute left-5 top-5 z-20 text-sm text-neutral-600 hover:text-black"
        >
          ← Back
        </button>
      )}

      <motion.div
        key={step}
        initial={{ opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className={`relative mx-auto flex min-h-dvh flex-col items-center px-5 pb-12 text-center 
          ${step === "benefits" ? "max-w-[850px] pt-[clamp(70px,17vh,170px)]" : "max-w-[1180px] pt-[clamp(60px,9vh,100px)]"}`}
      >
        {step === "benefits" ? (
          <>
            <h1
              id={titleId}
              className="leading-[1.08] font-[500] tracking-[-1px] sm:text-[40px] "
            >
              92% of subscribers improved their grades
              <br />
              with{" "}
              <span
                className="bg-clip-text text-transparent font-[600]"
                style={{ backgroundImage: spectrum }}
              >
                Premium
              </span>
            </h1>

            <div className="relative mt-12 w-full max-w-[600px] sm:mt-[50px]">

              <div
                aria-hidden="true"
                className="absolute inset-y-0 right-[21%] w-[19%] rounded-[18px] bg-[#eeebf3]/65"
              />

              <div
                aria-hidden="true"
                className="absolute -top-3 right-0 bottom-[-7px] w-[22%] rounded-[20px] p-[7px]"
                style={{ background: spectrum }}
              >
                <div className="mt-[66px] h-[calc(100%-66px)] rounded-[16px] bg-white/95" />
              </div>

              <table className="relative w-full table-fixed border-collapse text-left text-[12px] sm:text-[15px]">

                <colgroup>
                  <col className="w-[60%]" />
                  <col className="w-[19%]" />
                  <col className="w-[21%]" />
                </colgroup>

                <thead>
                  <tr className="h-[62px] text-[16px]">
                    <th scope="col" className="font-bold">
                      Benefits
                    </th>
                    <th
                      scope="col"
                      className="text-center font-bold text-neutral-600"
                    >
                      Free
                    </th>
                    <th scope="col" className="text-center font-bold">
                      Premium
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {[
                    "Daily lesson",
                    "A personal tutor in every lesson",
                    "Unlimited learning",
                    "Unlimited Quizez, flashcards, podcasts and notes",
                    "Unlimited uploads — PDFs, YouTube etc.",
                  ].map((benefit, i) => (
                    <tr
                      key={benefit}
                      className="h-[68px] border-t-2 border-black/[.06]"
                    >
                      <th scope="row" className="pr-2 font-[450] text-black">
                        {benefit}
                        {i === 2 && (
                          // <Mascot className="ml-2 inline-block size-8 align-middle" />
                          <img src="/Paywall/paywall_doodle_2.png" alt="doodle img" className="w-[25px] h-auto ml-2 inline-block size-8 align-middle"/>
                        )}
                      </th>

                      <td>
                        <Status included={i === 0} />
                      </td>

                      <td>
                        <Status included />
                      </td>
                    </tr>
                  ))}
                </tbody>

              </table>
            </div>

            <button
              type="button"
              className={`${cta} mt-[clamp(48px,12vh,110px)] max-w-[340px]`}
              onClick={() => setStep("plans")}
            >
              Continue
            </button>
          </>
        ) : (
          <>

            {/* <PremiumKey /> */}
            <img src="/Paywall/img_2.png" alt="" className="w-[200px] h-auto"/>

            <h1
              id={titleId}
              className="mt-5 text-[32px] leading-[1.12] font-bold tracking-[-1px] sm:text-[40px]"
            >
              Unlock the full Notium experience
            </h1>

            <p className="mt-4 text-[16px] text-[#494949] sm:text-[18px]">
              Premium gives you unlimited learning, personalized tutoring, and
              more.
            </p>

            <fieldset className="mt-[90px] max-w-[1000px]  grid w-full items-center grid-cols-1 gap-12 lg:gap-5  text-center sm:grid-cols-3">

              <legend className="sr-only">Choose a subscription plan</legend>

              {plans.map((plan) => (
                <label key={plan.id} className={`relative block cursor-pointer ${plan.id === "annual" ? "mt-6 lg:mt-0" : ""}`}>

                  <input
                    type="radio"
                    name={`${titleId}-plan`}
                    value={plan.id}
                    checked={selected === plan.id}
                    onChange={() => {
                      setSelected(plan.id);
                      setMessage("");
                    }}
                    disabled={busy}
                    className="peer sr-only"
                  />

                  {plan.id === "annual" && (
                    <span
                      style={{ background: spectrum }}
                      className={`absolute !-left-[1px] !-right-[1px] !-top-[26px] !-bottom-[1px]  overflow-hidden
                         pt-1 text-[14px] font-semibold text-gray-900 
                        before:absolute before:inset-0 before:content-[''] rounded-t-[20px] rounded-b-[12px] z-1
                        ${selected === plan.id ? "" : "before:bg-white/70 grayscale-25"}`}
                    >
                      <span className="relative z-10">MOST POPULAR</span>
                    </span>
                  )}

                  {selected === plan.id && (
                    <span className={`pointer-events-none absolute left-[50%] h-[57px] w-[86px] z-0 animate-uprise 
                        ${plan.id === "annual" ? "-top-[70px]" : "-top-[42px] "}`}>

                      {/* <Mascot className="h-[50px] w-auto -rotate-[0deg] " /> */}
                      {selected === "weekly" && (
                        <img src="/Paywall/paywall_doodle_1.png" alt="doodle img" className="h-[50px] w-auto -translate-x-[50%]"/>
                      )}

                      {selected === "annual" && (
                        <img src="/Paywall/paywall_doodle_2.png" alt="doodle img" className="h-[50px] w-auto -translate-x-[50%]"/>
                      )}           

                      {selected === "monthly" && (
                        <img src="/Paywall/paywall_doodle_4.png" alt="doodle img" className="h-[50px] w-auto -translate-x-[50%]"/>
                      )}                                    

                      {/* <svg
                        viewBox="0 0 30 30"
                        className="absolute right-0 top-0 size-7"
                        aria-hidden="true"
                      >
                        <path
                          d="m9 11 4-9m3 14 10-5m-8 12 10 2"
                          stroke="#333"
                          strokeWidth="2"
                          fill="none"
                        />
                      </svg> */}
                    </span>
                  )}

                  <span
                    className={`z-2 relative block h-full rounded-[12px] p-[3px]
                     peer-focus-visible:outline-blue-600 `}
                    style={{
                      background:
                        plan.id === "annual" ? "" : selected === plan.id ? spectrum : "#e5e7eb"
                    }}
                  >

                    <span className={`${plan.id !== selected ?  "text-gray-600" : "text-black"} 
                      flex h-full flex-col hover:text-gray-800 items-center font-Inter justify-center rounded-[10px] bg-white/95 px-3 py-7`}>
                      <span className="text-[20px] font-bold">
                        {plan.name}
                      </span>

                      <span className="mt-1 text-[18px]">
                        <strong className="font-bold">
                          ${plan.price}
                        </strong>
                        
                        <span className="text-gray-400 font-[300] text-[16px]">
                          <span className="mx-[3px]">
                            /
                          </span>
                          {plan.id === "weekly" ? "week" : "month"}
                          <span className={`${selected === plan.id ? "opacity-100" : "opacity-0"}`}>
                            *
                          </span>
                        </span>
                      </span>
                      {/* {plan.id === "family" && (
                        <span className="mt-1 text-[18px] text-[#777]">
                          6 seats
                        </span>
                      )} */}
                    </span>
                  </span>
                </label>


              ))}
            </fieldset>

            <p className="mt-12 min-h-12 text-[14px] text-[#777] sm:text-[14px]">
              {plans.find((p) => p.id === selected)?.note}
            </p>

            <button
              type="button"
              className={`${cta} mt-[clamp(34px,10vh,100px)]`}
              disabled={busy}
              onClick={() => void subscribe()}
            >
              {busy ? "Opening checkout…" : "Subscribe now"}
            </button>
            
            <p
              role="status"
              aria-live="polite"
              className="mt-4 min-h-6 text-sm text-neutral-600"
            >
              {message}
            </p>
          </>
        )}
      </motion.div>
    </dialog>
  );
}
