

export default function Flag({ country }: { country: string }) {
  return (
    <span
      aria-hidden="true"
      className={`fi fi-${country} !h-[18px] !w-6 shrink-0
        overflow-hidden rounded-[3px] ring-1 ring-black/5`}
    />
  );
}