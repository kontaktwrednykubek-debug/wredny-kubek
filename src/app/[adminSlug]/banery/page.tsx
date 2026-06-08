import { BaneryAdmin } from "./BaneryAdmin";

export const metadata = { title: "Banery / Promocje" };

export default function BaneryPage({ params }: { params: { adminSlug: string } }) {
  return <BaneryAdmin adminSlug={params.adminSlug} />;
}
