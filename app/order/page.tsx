import OrderMenu from "@/components/OrderMenu"

export default async function OrderPage({
  searchParams,
}: {
  searchParams: Promise<{ table?: string; party?: string }>
}) {
  const { table, party } = await searchParams
  const tableNum = table ? parseInt(table, 10) : null
  const partyNum = party ? parseInt(party, 10) : null

  return <OrderMenu tableNum={tableNum} partyNum={partyNum} />
}
