import React, { HTMLAttributes } from 'react'
import './Grid.css'

export interface GridProps extends HTMLAttributes<HTMLDivElement> {
  columns?: number | { sm?: number; md?: number; lg?: number; xl?: number }
  gap?: number | string
  rowGap?: number | string
  columnGap?: number | string
  children: React.ReactNode
}

export const Grid: React.FC<GridProps> = ({
  columns = 12,
  gap,
  rowGap,
  columnGap,
  className = '',
  style,
  children,
  ...props
}) => {
  const gridStyle: React.CSSProperties = {
    ...style,
    ...(typeof columns === 'number' && { '--grid-columns': columns }),
    ...(gap && { '--grid-gap': typeof gap === 'number' ? `var(--spacing-${gap})` : gap }),
    ...(rowGap && {
      '--grid-row-gap': typeof rowGap === 'number' ? `var(--spacing-${rowGap})` : rowGap,
    }),
    ...(columnGap && {
      '--grid-column-gap':
        typeof columnGap === 'number' ? `var(--spacing-${columnGap})` : columnGap,
    }),
  } as React.CSSProperties

  const gridClassNames = ['ds-grid', className].filter(Boolean).join(' ')

  return (
    <div className={gridClassNames} style={gridStyle} {...props}>
      {children}
    </div>
  )
}

Grid.displayName = 'Grid'

export interface GridItemProps extends HTMLAttributes<HTMLDivElement> {
  colSpan?: number | { sm?: number; md?: number; lg?: number; xl?: number }
  rowSpan?: number
  children: React.ReactNode
}

export const GridItem: React.FC<GridItemProps> = ({
  colSpan,
  rowSpan,
  className = '',
  style,
  children,
  ...props
}) => {
  const itemStyle: React.CSSProperties = {
    ...style,
    ...(typeof colSpan === 'number' && { gridColumn: `span ${colSpan}` }),
    ...(rowSpan && { gridRow: `span ${rowSpan}` }),
  }

  const itemClassNames = ['ds-grid-item', className].filter(Boolean).join(' ')

  return (
    <div className={itemClassNames} style={itemStyle} {...props}>
      {children}
    </div>
  )
}

GridItem.displayName = 'GridItem'
