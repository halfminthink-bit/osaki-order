import ConfirmView from "@/components/ConfirmView"

export default async function ConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ table?: string; party?: string; items?: string }>
}) {
  const { table, party, items } = await searchParams

  return <ConfirmView table={table} party={party} items={items} />
}
