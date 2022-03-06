export type transaction = {
  type: string;
  refId: number;
  asset: string;
  side: string;
  amount: number;
  feeAmount: number;
  price: number;
  timestamp: number;
};
export type transactionBundle = (
  | (Omit<transaction, "price"> & {
    price: Promise<number | boolean> | number;
  })[]
  | null
)[];
