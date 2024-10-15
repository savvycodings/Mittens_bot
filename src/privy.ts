import { PrivyClient } from "@privy-io/server-auth";

export const privy = new PrivyClient(
  process.env.PRIVY_CLIENT_ID!,
  process.env.PRIVY_CLIENT_SECRET!,
);

export async function privysign(id: string, transaction: any) {
  const { hash } = await privy.walletApi.solana.signAndSendTransaction({
    walletId: id,
    caip2: "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
    transaction: transaction,
  });
  return hash;
}
