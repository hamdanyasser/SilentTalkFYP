import React, { HTMLAttributes } from 'react'
import './Stack.css'

export type StackDirection = 'row' | 'column'
export type StackAlign = 'start' | 'center' | 'end' | 'stretch'
export type StackJustify = 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'

export interface StackProps extends HTMLAttributes<HTMLDivElement> {
  direction?: StackDirection
  gap?: number | string
  align?: StackAlign
  justify?: StackJustify
  wrap?: boolean
  children: React.ReactNode
}

export const Stack: React.FC<StackProps> = ({
  direction = 'column',
  gap = 4,
  align,
  justify,
  wrap = false,
  className = '',
  style,
  children,
  ...props
}) => {
  const stackStyle: React.CSSProperties = {
    ...style,
    '--stack-gap': typeof gap === 'number' ? `var(--spacing-${gap})` : gap,
  } as React.CSSProperties

  const stackClassNames = [
    'ds-stack',
    `ds-stack--${direction}`,
    align && `ds-stack--align-${align}`,
    justify && `ds-stack--justify-${justify}`,
    wrap && 'ds-stack--wrap',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={stackClassNames} style={stackStyle} {...props}>
      {children}
    </div>
  )
}

Stack.displayName = 'Stack'
