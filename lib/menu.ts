export type MenuCategory = "main" | "noodles" | "side" | "drink" | "dessert"

export type MenuItem = {
  id: string
  name: string
  price: number
  category: MenuCategory
  description?: string
  emoji: string
  isSoldOut: boolean
}

export const MENU_ITEMS: MenuItem[] = [
  { id: "main-001", name: "唐揚げ定食", price: 980, category: "main", emoji: "🍱", isSoldOut: false },
  { id: "main-002", name: "ハンバーグ定食", price: 1180, category: "main", emoji: "🍔", isSoldOut: true },
  { id: "noodles-001", name: "醤油ラーメン", price: 880, category: "noodles", emoji: "🍜", isSoldOut: false },
  { id: "noodles-002", name: "味噌ラーメン", price: 920, category: "noodles", emoji: "🍜", isSoldOut: false },
  { id: "side-001", name: "餃子", price: 480, category: "side", emoji: "🥟", isSoldOut: false },
  { id: "side-002", name: "枝豆", price: 380, category: "side", emoji: "🌱", isSoldOut: true },
  { id: "drink-001", name: "生ビール", price: 580, category: "drink", emoji: "🍺", isSoldOut: false },
  { id: "drink-002", name: "ウーロン茶", price: 280, category: "drink", emoji: "🍵", isSoldOut: false },
  { id: "dessert-001", name: "杏仁豆腐", price: 380, category: "dessert", emoji: "🍮", isSoldOut: false },
]

export const CATEGORY_LABELS: Record<MenuCategory, string> = {
  main: "メイン",
  noodles: "麺類",
  side: "サイドメニュー",
  drink: "ドリンク",
  dessert: "デザート",
}

export const CATEGORIES: MenuCategory[] = ["main", "noodles", "side", "drink", "dessert"]
