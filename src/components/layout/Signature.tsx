/** Author's signature, placed at the bottom-right of the page. Written once in ink when the page loads. */
export function Signature({ name = 'Shivam' }: { name?: string }) {
  return (
    <div className="no-print mt-10 flex justify-end select-none" aria-label={`Signed by ${name}`}>
      <svg viewBox="0 0 150 60" className="h-9 w-[92px] sm:h-12 sm:w-[124px]" aria-hidden>
        <text
          x="6"
          y="42"
          fontFamily="'Mrs Saint Delafield', cursive"
          fontSize="46"
          fill="#1f2a44"
          stroke="#1f2a44"
          strokeWidth="0.6"
          strokeDasharray="520"
          className="animate-ink"
        >
          {name}
        </text>
      </svg>
    </div>
  )
}
