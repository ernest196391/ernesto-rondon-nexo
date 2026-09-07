import {redirect} from "next/navigation";
import {currentCommercialActor} from "../../lib/commercial/auth";
import {adminOverview} from "../../lib/commercial/admin-overview";
import AdminClient from "./AdminClient";
import "./admin.css";
export const dynamic="force-dynamic";
export const metadata={title:"Centro de control | NEXO"};
export default async function Page(){const actor=await currentCommercialActor();if(!actor||actor.role!=="admin")redirect("/admin/login");const data=await adminOverview();return <AdminClient initial={data}/>;}
