
import {type Seller } from "./sellerTypes";
import {type Transaction } from "./Transaction";


export interface Payouts {
  _id: string;
  transactions: Transaction[];
  seller: Seller;
  amount: number;
  status: "PENDING" | "SUCCESS" | "REJECTED";
  date: string;
}
