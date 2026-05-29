interface Props {
  children: React.ReactNode
  className?: string
  as?: React.ElementType
}

export default function Card({ children, className = '', as: Tag = 'div' }: Props) {
  return (
    <Tag className={`rounded-xl border border-border bg-white shadow-sm ${className}`}>
      {children}
    </Tag>
  )
}
