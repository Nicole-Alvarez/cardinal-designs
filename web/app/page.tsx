import HomePage from "@/features/home/home-page";

type HomeSearchParams = {
  q?: string;
  tag?: string;
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<HomeSearchParams>;
}) {
  const params = await searchParams;
  return <HomePage initialQuery={params.q ?? ""} initialTag={params.tag ?? ""} />;
}