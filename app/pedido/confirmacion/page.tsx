import type { Metadata } from "next";
import CommerceHeader from "../../CommerceHeader";
import ConfirmationClient from "./ConfirmationClient";
import "./confirmation.css";

export const metadata:Metadata={title:"Pedido confirmado"};
export default function ConfirmationPage(){return <main className="confirmation-page"><CommerceHeader/><ConfirmationClient/></main>;}
