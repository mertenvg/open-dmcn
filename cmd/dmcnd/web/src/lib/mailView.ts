// Sent-vs-received classification for mailbox messages.
//
// Mailbox messages are per-recipient copies. Normally a copy in my mailbox was sent
// by someone else, so it's received mail. The one exception is mailing yourself: the
// single copy that lands in my mailbox has ME as both sender and recipient. That copy
// is genuine received mail and belongs in the Inbox — it also appears in Sent, which
// reads from the separate personal-store record (a different source, so no duplicate).
//
// isReceivedForMe centralizes the rule both the received views (InboxMain) and the
// nav counts (AppLayout) key off, so they never disagree about whether a self-
// addressed message is shown/counted.

export interface Addressed {
  senderAddress: string;
  recipientAddress: string;
  to: string[];
  cc: string[];
}

// isReceivedForMe reports whether a mailbox message should appear in received views
// (Inbox/Pending/labels/folders) for the owner at `address`.
export function isReceivedForMe(m: Addressed, address: string | null): boolean {
  if (!address) return false;
  const me = address.toLowerCase();
  if (m.senderAddress.toLowerCase() !== me) return true; // from someone else → received
  // I sent it — received only if I'm also a recipient (I mailed myself).
  return m.recipientAddress.toLowerCase() === me
    || m.to.some(a => a.toLowerCase() === me)
    || m.cc.some(a => a.toLowerCase() === me);
}
