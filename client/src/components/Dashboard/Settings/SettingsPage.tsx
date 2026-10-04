import { useMemo, useState, type ComponentType, type ReactNode } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  ChevronRight,
  CircleCheck,
  Cookie,
  Download,
  Info,
  KeyRound,
  Play,
  Rocket,
  Trash2,
  UserRound,
  Volume2,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import StatusBadge from "./StatusBadge";
import SegmentedControl from "./SegmentedControl";
import Toggle from "./Toggle";
import { ThemePicker } from "./ThemePicker";

type SettingsTab = "account" | "premium" | "preferences";
type ColorMode = "auto" | "light" | "dark";
type MotionMode = "auto" | "on" | "off";

type SettingsPageProps = {
  onBack: () => void;
  onUpgrade?: () => void;
};



const settingTabs: Array<{
  id: SettingsTab;
  label: string;
  icon: ComponentType<{ size?: number; strokeWidth?: number }>;
}> = [
  { id: "account", label: "Account", icon: UserRound },
  { id: "premium", label: "Premium", icon: KeyRound },
  { id: "preferences", label: "Preferences", icon: SlidersIcon },
];



function SlidersIcon({ size = 18, strokeWidth = 1.8 }: { size?: number; strokeWidth?: number }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 6h6" />
      <path d="M14 6h6" />
      <path d="M4 18h3" />
      <path d="M11 18h9" />
      <path d="M10 4v4" />
      <path d="M7 16v4" />
    </svg>
  );
}






function Divider() {
  return <div aria-hidden="true" className="my-8 h-px bg-[#e9e9e9]" />;
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[15px] font-[650] text-[#111]">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-[52px] w-full rounded-[10px] border-2 border-[#dcdcdc] bg-white px-4 text-[16px] text-[#111] outline-none
         transition-[border,box-shadow] placeholder:text-[#999] focus:border-[#155dfc] focus:ring-1 focus:ring-[#155dfc]/15"
      />
    </label>
  );
}


function PageHeading({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <header className="mb-8">
      <h1 className="text-[30px] font-[750] tracking-[-1px] text-[#080808]">{title}</h1>
      {description ? (
        <p className="mt-2 max-w-[580px] text-[15px] leading-6 text-[#737373]">{description}</p>
      ) : null}
    </header>
  );
}




function SectionTitle({ 
  children,
  classes
}: { children: ReactNode, classes?: string }) {
  return <h2 className={`${classes} mb-4 text-[23px] font-[720] tracking-[-0.4px] text-[#111]`}>{children}</h2>;
}


function SettingRow({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex min-h-[64px] items-center justify-between gap-5 rounded-[15px] border border-[#e2e2e2] bg-white px-4 py-3.5 transition-colors hover:border-[#d4d4d4] ${className}`}
    >
      {children}
    </div>
  );
}


function AccountSettings() {
  const [firstName, setFirstName] = useState("Kuba");
  const [lastName, setLastName] = useState("Gacek");
  const [savedNames] = useState({ firstName: "Kuba", lastName: "Gacek" });

  const hasChanges = useMemo(
    () => firstName !== savedNames.firstName || lastName !== savedNames.lastName,
    [firstName, lastName, savedNames.firstName, savedNames.lastName],
  );

  return (
    <div>
      <PageHeading title="Personal data" />

      <div className="space-y-5">
        <Field label="First name" value={firstName} onChange={setFirstName} />
        <Field label="Last name" value={lastName} onChange={setLastName} />
        <button
          type="button"
          disabled={!hasChanges}
          className="h-[49px] w-full rounded-full bg-[#eeeeee] px-5 text-[15px] font-[600] text-[#b7b7b7] transition-colors enabled:bg-[#111] enabled:text-white enabled:hover:bg-[#242424]"
        >
          Update personal info
        </button>
      </div>

      <Divider />

      <section aria-labelledby="email-heading">
        <SectionTitle>
          <span id="email-heading">Email address</span>
        </SectionTitle>
        <div className="flex min-h-[66px] items-center justify-between gap-4 rounded-[11px] border border-[#e1e1e1] px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-[15px] font-[650] text-[#111]">you@example.com</p>
            <p className="mt-1 text-[12px] text-[#8a8a8a]">Your primary Notium email</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <StatusBadge tone="green">
              <BadgeCheck size={12}/>
              VERIFIED
            </StatusBadge>
            <StatusBadge tone="blue">PRIMARY</StatusBadge>
          </div>
        </div>
        <button
          type="button"
          className="mt-4 h-[49px] w-full rounded-full bg-[#080808] px-5 text-[15px] font-[600] text-white transition-[background,transform] hover:bg-[#242424] active:translate-y-px"
        >
          Add another email
        </button>
      </section>

      <Divider />

      <section aria-labelledby="password-heading">
        <SectionTitle>
          <span id="password-heading">Password</span>
        </SectionTitle>
        <div className="flex gap-3 rounded-[13px] bg-[#dfe6ff] px-4 py-4 text-[14px] leading-6 text-[#111]">
          <Info className="mt-1 size-[18px] shrink-0" strokeWidth={2.1} />
          <p>
            Your account uses social authentication. If you want to set a password, you can do so
            from your social connections page.
          </p>
        </div>
      </section>

      <Divider />

      <section aria-labelledby="data-heading">
        <SectionTitle>
          <span id="data-heading">Your data</span>
        </SectionTitle>
        <SettingRow>
          <div>
            <p className="font-[600] text-[#111]">Export your data</p>
            <p className="mt-1 text-[13px] text-[#777]">Download a copy of your Notium activity.</p>
          </div>
          <button
            type="button"
            className="flex h-10 shrink-0 items-center gap-2 rounded-full border border-[#dedede] px-4 text-[14px] font-[600] text-[#222] transition-colors hover:border-[#111]"
          >
            <Download size={16} />
            Export
          </button>
        </SettingRow>
      </section>

      <section aria-labelledby="data-heading" className="mt-10">
        <SectionTitle>
          <span id="data-heading">Your Cookies</span>
        </SectionTitle>
        <SettingRow>
          <div>
            <p className="font-[600] text-[#111]">Manage your cookies</p>
            <p className="mt-1 text-[13px] text-[#777]">Change your cookie settings to your preference.</p>
          </div>
          <button
            type="button"
            className="flex h-10 shrink-0 items-center gap-2 rounded-full border border-[#dedede] px-4 text-[14px]
             font-[600] text-[#222] transition-colors hover:border-[#111]"
          >
            <Cookie size={16} />
            Manage
          </button>
        </SettingRow>
      </section>      

      <Divider />

      <section aria-labelledby="management-heading" className="pb-8">
        <SectionTitle>
          <span id="management-heading">Account management</span>
        </SectionTitle>
        <p className="mb-5 text-[14px] leading-6 text-gray-600">
          If you need a break or want to delete your account, you can deactivate or delete your account at any time.
        </p>
        <a
          href="/account/delete"
          className="text-[15px] font-[500] text-blue-600
            underline-offset-[3px] hover:underline"
        >
          Deactivate or delete your account
        </a>
      </section>
    </div>
  );
}

const spectrum =
  "linear-gradient(105deg,#6ab8ff 0%,#a6a6ff 28%,#ddb2f5 52%,#f8c0d8 75%,#ffe39a 100%)";

// Original, self-contained vector artwork: no image files or SVG IDs required.
function PremiumArtwork({ kind, className = "size-8" }: {
  kind: "key" | "lesson" | "tutor" | "infinity" | "materials" | "uploads";
  className?: string;
}) {
  const artwork: Record<typeof kind, ReactNode> = {
    key: <>
      <path d="M17 16 7 32l10 16h19l9-12h9v8h9v-8h8V25H44l-8-9Zm4 11h10l4 5-4 5H21l-4-5Z" fill="#7771cf" fillRule="evenodd" />
      <path d="M17 12 7 28l10 16h19l9-12h9v8h9v-8h8V21H44l-8-9Zm4 11h10l4 5-4 5H21l-4-5Z" fill="#a6a6ff" fillRule="evenodd" />
      <path d="m7 28 10 16 5-11-5-5 4-5-4-11Z" fill="#ffe39a" />
      <path d="m17 12 5 11h9l5-11Z" fill="#e4e5ff" />
      <path d="m36 12 8 9h27l-6 6H40l-5-5Z" fill="#f8c0d8" />
      <path d="m54 32 9-5v13h-9Z" fill="#8d82df" />
      <path d="M4 12v8m-4-4h8M64 3v8m-4-4h8M76 43v6m-3-3h6" stroke="#ddb2f5" strokeWidth="1.5" />
    </>,
    lesson: <>
      <rect x="9" y="11" width="45" height="47" rx="8" fill="#817bce" />
      <rect x="9" y="7" width="45" height="45" rx="8" fill="#ddd9ff" />
      <path d="M17 7h29a8 8 0 0 1 8 8v7H9v-7a8 8 0 0 1 8-8" fill="#a6a6ff" />
      <path d="M21 5v9m21-9v9" stroke="#625ba6" strokeWidth="5" strokeLinecap="round" />
      <path d="m23 35 6 6 12-13" fill="none" stroke="#155dfc" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m51 37 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z" fill="#ffe39a" />
    </>,
    tutor: <>
      <path d="M12 47c0-13 39-13 39 0v9H12Z" fill="#a6a6ff" />
      <path d="M12 49h39v7H12Z" fill="#8079cb" />
      <rect x="17" y="13" width="28" height="31" rx="10" fill="#ffbf88" />
      <path d="M17 27V23c0-15 28-15 28 0v4" fill="none" stroke="#7973bc" strokeWidth="5" />
      <rect x="13" y="24" width="7" height="13" rx="3" fill="#a6a6ff" />
      <rect x="43" y="24" width="7" height="13" rx="3" fill="#a6a6ff" />
      <path d="M46 35v4h-9" fill="none" stroke="#7973bc" strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="26" cy="27" rx="2" ry="3" fill="#303047" /><ellipse cx="36" cy="27" rx="2" ry="3" fill="#303047" />
      <path d="M27 35q4 4 8 0" fill="none" stroke="#9b543b" strokeWidth="2" strokeLinecap="round" />
      <path d="m50 5 2 5 5 2-5 2-2 5-2-5-5-2 5-2Z" fill="#ffe39a" />
    </>,
    infinity: <>
      <path d="M31 35c-7-13-23-13-23 0s16 13 23 0 25-13 25 0-18 13-25 0Z" fill="none" stroke="#8374c8" strokeWidth="11" />
      <path d="M31 30c-7-13-23-13-23 0s16 13 23 0 25-13 25 0-18 13-25 0Z" fill="none" stroke="#a6a6ff" strokeWidth="10" />
      <path d="M31 30c7-13 25-13 25 0" fill="none" stroke="#f8c0d8" strokeWidth="10" />
      <path d="M8 30c0 13 16 13 23 0" fill="none" stroke="#6ab8ff" strokeWidth="10" />
      <path d="m47 3 2 5 5 2-5 2-2 5-2-5-5-2 5-2Z" fill="#ffe39a" />
    </>,
    materials: <>
      <rect x="8" y="9" width="31" height="42" rx="4" fill="#6ab8ff" transform="rotate(-12 23 30)" />
      <rect x="21" y="10" width="32" height="43" rx="4" fill="#9a8cda" transform="rotate(9 37 31)" />
      <rect x="20" y="11" width="30" height="39" rx="4" fill="#f1dcfa" />
      <path d="M26 20h16m-16 6h12" stroke="#9b82cc" strokeWidth="3" strokeLinecap="round" />
      <circle cx="42" cy="45" r="13" fill="#ffe39a" />
      <path d="M36 47v-4a6 6 0 0 1 12 0v4m-12-3v5m12-5v5" fill="none" stroke="#a478ad" strokeWidth="3" strokeLinecap="round" />
    </>,
    uploads: <>
      <path d="M7 23V13a4 4 0 0 1 4-4h15l6 7h20a4 4 0 0 1 4 4v30H7Z" fill="#9891db" />
      <path d="M13 16h22l10 10v23H13Z" fill="#f4edff" /><path d="M35 16v10h10" fill="#cec4ef" />
      <path d="M5 27h53l-6 28H10Z" fill="#ffe39a" /><path d="m10 49 42-1v7H10Z" fill="#edc77e" />
      <circle cx="44" cy="20" r="14" fill="#6ab8ff" />
      <path d="M44 27V13m-6 6 6-6 6 6" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    </>,
  };
  return <svg aria-hidden="true" focusable="false" viewBox={kind === "key" ? "0 0 80 56" : "0 0 64 64"} className={`shrink-0 ${className}`}>{artwork[kind]}</svg>;
}


const benefits = [
  "Daily lesson",
  "A personal tutor in every lesson",
  "Unlimited learning",
  "Unlimited quizzes, flashcards, podcasts and notes",
  "Unlimited uploads — PDFs, YouTube etc.",
];

type PremiumCardProps = {
  onUpgrade?: () => void;
};


export function PremiumCard({ onUpgrade }: PremiumCardProps) {
  return (
    <section
        style={{
          background:
            "linear-gradient(to bottom,transparent,white),linear-gradient(110deg,#c7e3ff 0%,#fbe1fa 35%,#fff0e1 65%,#fff5bc 100%)",
        }}
      className="relative isolate w-full max-w-[768px] overflow-hidden
        rounded-[26px] p-4 text-gray-900"
    >
      <div className="relative px-2 pt-2">
        <div className="pr-[100px] sm:pr-[145px]">
          <p className="text-[13px] font-semibold">
            Unlock your potential
          </p>

          <h2
            className="mt-1 w-fit text-[40px] font-black
              leading-[1.15] tracking-[-1.5px] sm:text-[48px]"
          >
            Premium
          </h2>
        </div>

        <img
          src="/Paywall/img_2.png"
          alt=""
          aria-hidden="true"
          draggable={false}
          className="pointer-events-none absolute -right-2 -top-3
            size-[115px] select-none object-contain
            sm:-right-1 sm:-top-5 sm:size-[155px]"
        />

        <ul className="mt-6 space-y-3 sm:mt-5 sm:space-y-2.5">
          {benefits.map((benefit) => (
            <li
              key={benefit}
              className="flex items-start gap-2.5 text-[14px]
                leading-[1.5] sm:text-[15px]"
            >
              <CircleCheck
                aria-hidden="true"
                size={19}
                strokeWidth={1.8}
                className="mt-[2px] shrink-0"
              />
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
      </div>

      <button
        type="button"
        onClick={onUpgrade}
        className="mt-6 flex gap-2 justify-center items-center min-h-[52px] w-full rounded-full border-b-[4px] border-black active:border-b-0 select-none
          bg-[linear-gradient(110deg,#363636,#292929)] px-6 py-3 text-[16px]  text-white transition-[transform,filter]
          hover:brightness-110 active:translate-y-[3px] disabled:cursor-wait disabled:opacity-60 focus-visible:outline-2
          focus-visible:outline-offset-4 focus-visible:outline-blue-600 font-[500]"
      >
        {/* <Rocket size={20} aria-hidden="true" /> */}
        Explore Premium
      </button>
    </section>
  );
}




function PremiumSettings({ onUpgrade }: { onUpgrade?: () => void }) {

  return (
    <div>
      {/* <PageHeading title="Premium" /> */}


      <PremiumCard onUpgrade={onUpgrade}/>
      {/* <section className="relative isolate overflow-hidden rounded-[20px] border-2 border-[#e5e5e5] bg-white p-5 shadow-[0_1px_2px_#00000005] sm:p-6">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10" style={{ backgroundImage: `linear-gradient(to bottom,#ffffff 0%,#ffffff 37%,rgba(255,255,255,.96) 49%,rgba(255,255,255,.57) 100%),${spectrum}` }} />
        <div className="mb-[18px] h-[68px] w-[88px]">
          <PremiumArtwork kind="key" className="h-full w-full" />
        </div>

        <h2 className="font-serif text-[24px] font-medium leading-[1.2] tracking-[-0.45px] text-[#080808]">
          Unlock the full Notium experience with{" "}
          <span className="bg-clip-text text-transparent" style={{ backgroundImage: spectrum }}>
            Premium
          </span>
        </h2>
        <p className="mt-2 text-[15px] leading-6 text-[#737373]">Access to all your learning tools, features, and more</p>

        <div className="my-6 h-px bg-[#e5e5e5]" />

        <h3 className="mb-4 text-[16px] font-[700] text-[#111]">Premium benefits</h3>
        <ul className="m-0 list-none space-y-[18px] p-0">
          {benefits.map(({ icon, label }) => (
            <li key={label} className="flex min-h-[34px] items-center gap-4 text-[15px] leading-[1.45] text-[#111]">
              <PremiumArtwork kind={icon} />
              <span>{label}</span>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={onUpgrade}
          style={{ backgroundImage: spectrum }}
          className="mt-6 min-h-[52px] w-full rounded-full border-0 border-b-4 border-black/25 px-5 py-3 text-[16px] font-[550] text-[#111] transition-[filter,transform] hover:brightness-[1.03] active:translate-y-px motion-reduce:transition-none"
        >
          View Premium plans
        </button>
      </section> */}

      <Divider />

      <section aria-labelledby="current-plan-heading" className="pb-8">
        <div className="flex items-end justify-between gap-5">
          <div>
            <h2 id="current-plan-heading" className="text-[17px] font-[700] text-[#111]">
              Current plan
            </h2>
            <p className="mt-1 text-[16px] text-[#666]">Free plan</p>
          </div>
          <button
            type="button"
            onClick={onUpgrade}
            className="flex items-center gap-2 text-[15px] font-[600] text-[#111] transition-colors hover:text-[#155dfc]"
          >
            View plans
            <ChevronRight size={18} />
          </button>
        </div>
        <div className="mt-6 flex items-center justify-between border-t border-[#e9e9e9] pt-5 text-[14px] text-[#777]">
          <span>Need help with Premium?</span>
          <button type="button" className="font-[600] text-[#111] hover:text-[#155dfc]">
            Contact support
          </button>
        </div>
      </section>
    </div>
  );
}

function PreferencesSettings() {
  const [colorMode, setColorMode] = useState<ColorMode>("light");
  const [animations, setAnimations] = useState<boolean>(true);
  const [soundEffects, setSoundEffects] = useState(true);
  const [dailyPractice, setDailyPractice] = useState(false);
  const [promotions, setPromotions] = useState(false);
  const [streakReminders, setStreakReminders] = useState(false);
  const [streakAlerts, setStreakAlerts] = useState(false);
  const [featureNews, setFeatureNews] = useState(false);
  const [disableNonEssential, setDisableNonEssential] = useState(false);
  // const [playVoice, setPlayVoice] = useState(false);

  const handleColorModeChange = (value: string) => setColorMode(value as ColorMode);

  return (
    <div className="pb-8">
      {/* <PageHeading title="Preferences" /> */}

      <section aria-labelledby="appearance-heading">
        <SectionTitle classes="!mb-0">
          <span id="appearance-heading">Appearance</span>
        </SectionTitle>
        
        <div className="space-y-3">
          <ThemePicker
            value={colorMode}
            onChange={handleColorModeChange}
          />
          {/* <SettingRow>
            <span className="text-[15px] text-[#111]">Theme color</span>
            <SegmentedControl
              value={colorMode}
              onChange={handleColorModeChange}
              ariaLabel="Color mode"
              options={[
                { value: "auto", label: "Auto" },
                { value: "light", label: "Light" },
                { value: "dark", label: "Dark" },
              ]}
            />
          </SettingRow> */}

          <SettingRow>
            <span className="text-[15px] text-[#111]">Animations</span>
            <Toggle checked={animations} onChange={setAnimations} label="Enable animations" />            
            {/* <SegmentedControl
              value={motionMode}
              onChange={handleMotionModeChange}
              ariaLabel="Reduce motion"
              options={[
                { value: "on", label: "On" },
                { value: "off", label: "Off" }
              ]}
            /> */}

          </SettingRow>
        </div>
      </section>

      <Divider />

      <section aria-labelledby="sounds-heading">
        <SectionTitle>
          <span id="sounds-heading">Sounds</span>
        </SectionTitle>

        <div className="space-y-3">
          {/* <SettingRow>
            <span className="text-[15px] text-[#111]">Enable Notium narration in lessons</span>
            <Toggle checked={narration} onChange={setNarration} label="Enable Notium narration" />
          </SettingRow> */}

          {/* <SettingRow>
            <span className="text-[15px] text-[#111]">Choose Notium&apos;s voice</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label={playVoice ? "Stop voice preview" : "Play voice preview"}
                onClick={() => setPlayVoice(!playVoice)}
                className="flex size-10 items-center justify-center rounded-full bg-[#f5f5f5] text-[#111] transition-colors hover:bg-[#ebebeb]"
              >
                {playVoice ? <Volume2 size={17} /> : <Play size={17} fill="currentColor" />}
              </button>
              <SegmentedControl
                value="deep"
                onChange={() => undefined}
                ariaLabel="Koji voice"
                options={[
                  { value: "melodic", label: "Melodic" },
                  { value: "deep", label: "Deep" },
                ]}
              />
            </div>
          </SettingRow> */}

          <SettingRow>
            <span className="text-[15px] text-[#111]">Enable sound effects in lessons</span>
            <Toggle checked={soundEffects} onChange={setSoundEffects} label="Enable sound effects" />
          </SettingRow>
        </div>
      </section>

      <Divider />

      <section aria-labelledby="notifications-heading">
        <SectionTitle>
          <span id="notifications-heading">Email notifications</span>
        </SectionTitle>

        <h3 className="mb-3 mt-6 text-[15px] font-[700] text-[#111]">Streaks</h3>
        <div className="space-y-3">
          <SettingRow>
            <span className="text-[15px] text-[#111]">Reminders during the day</span>
            <Toggle checked={streakReminders} onChange={setStreakReminders} label="Streak reminders" />
          </SettingRow>
          <SettingRow>
            <span className="max-w-[80%] text-[15px] leading-5 text-[#111]">
              Alerts when your streak is at risk of breaking
            </span>
            <Toggle checked={streakAlerts} onChange={setStreakAlerts} label="Streak risk alerts" />
          </SettingRow>
        </div>

        <h3 className="mb-3 mt-7 text-[15px] font-[700] text-[#111]">Learning reminders</h3>
        <div className="space-y-3">
          <SettingRow>
            <span className="text-[15px] text-[#111]">Daily practice</span>
            <Toggle checked={dailyPractice} onChange={setDailyPractice} label="Daily practice emails" />
          </SettingRow>
          {/* <SettingRow>
            <span className="text-[15px] text-[#111]">Personalized course recommendations</span>
            <Toggle checked={recommendations} onChange={setRecommendations} label="Course recommendations" />
          </SettingRow> */}
        </div>

        <h3 className="mb-3 mt-7 text-[15px] font-[700] text-[#111]">News and announcements</h3>
        <div className="space-y-3">
          <SettingRow>
            <span className="text-[15px] text-[#111]">Promotions</span>
            <Toggle checked={promotions} onChange={setPromotions} label="Promotions" />
          </SettingRow>
          <SettingRow>
            <span className="text-[15px] text-[#111]">New features</span>
            <Toggle checked={featureNews} onChange={setFeatureNews} label="New feature announcements" />
          </SettingRow>
        </div>
      </section>

      <Divider />

      <section aria-labelledby="global-heading">
        <SectionTitle>
          <span id="global-heading">Global settings</span>
        </SectionTitle>
        <SettingRow>
          <span className="max-w-[80%] text-[15px] leading-5 text-[#111]">
            Don&apos;t send me anything aside from vital account emails, such as password reset notifications
          </span>
          <Toggle checked={disableNonEssential} onChange={setDisableNonEssential} label="Disable non-essential emails" />
        </SettingRow>
      </section>
    </div>
  );
}

export default function SettingsPage({ onBack, onUpgrade }: SettingsPageProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("account");
  const reduceMotion = useReducedMotion();

  return (
    <main className="min-h-[calc(100dvh-76px)] bg-white px-6 py-8 text-[#111] @max-[720px]/home:px-[18px] @max-[720px]/home:py-6">
      <div className="mx-auto max-w-[1220px]">

        <button
          type="button"
          onClick={onBack}
          className="mb-5 inline-flex items-center gap-2 rounded-full px-2 py-1 text-[14px] font-[600] text-[#6e6e6e] transition-colors hover:text-[#111] md:hidden"
        >
          <ArrowLeft size={17} />
          Back to home
        </button>

        <div className="grid grid-cols-[280px_minmax(0,650px)] items-start gap-10 @max-[1050px]/home:grid-cols-[230px_minmax(0,1fr)]
         @max-[800px]/home:grid-cols-1 @max-[800px]/home:gap-7">
          <aside className="@max-[800px]/home:w-full">
            <nav
              aria-label="Settings sections"
              className="sticky top-6 rounded-[16px] border border-[#dfdfdf] bg-white p-4 @max-[800px]/home:static @max-[800px]/home:flex
               @max-[800px]/home:gap-2 @max-[800px]/home:overflow-x-auto @max-[800px]/home:p-2"
            >
              {settingTabs.map(({ id, label, icon: Icon }) => {
                const active = activeTab === id;
                return (
                  <button
                    type="button"
                    key={id}
                    onClick={() => setActiveTab(id)}
                    aria-current={active ? "page" : undefined}
                    className={`mb-1 flex w-full items-center gap-3 rounded-[11px] px-4 py-3 text-left text-[16px]
                       transition-[background,color,box-shadow] duration-150 last:mb-0 @max-[800px]/home:mb-0 @max-[800px]/home:w-auto @max-[800px]/home:shrink-0 @max-[800px]/home:px-3.5 @max-[800px]/home:py-2.5 ${
                      active
                        ? "bg-gray-50 font-[650] text-[#111] shadow-[0_0_0_2px_#155dfc]"
                        : "font-[450] text-[#777] hover:bg-[#f5f5f5] hover:text-[#111]"
                    }`}
                  >
                    <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
                    {label}
                  </button>
                );
              })}
            </nav>
          </aside>

          <section className="min-w-0">
            <motion.div
              key={activeTab}
              initial={reduceMotion ? false : { opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.18, ease: "easeOut" }}
            >
              {activeTab === "account" ? <AccountSettings /> : null}
              {activeTab === "premium" ? <PremiumSettings onUpgrade={onUpgrade} /> : null}
              {activeTab === "preferences" ? <PreferencesSettings /> : null}
            </motion.div>
          </section>
          
        </div>
      </div>
    </main>
  );
}
