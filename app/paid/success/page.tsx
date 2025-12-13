export default function PaidSuccess({ searchParams }: { searchParams: { session_id?: string } }) {
  return (
    <div style={{ padding: 48, textAlign: "center" }}>
      <h1>Payment successful 🎉</h1>
      <p>Your booking is now paid.</p>
      <p>Session ID: <code>{searchParams.session_id}</code></p>
    </div>
  )
}