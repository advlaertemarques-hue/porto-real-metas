'use client'

import { ReactNode } from 'react'

interface StatCardProps {
  icon: ReactNode
  iconBg: string
  label: string
  value: string | number
  subtitle: string
}

export default function StatCard({ icon, iconBg, label, value, subtitle }: StatCardProps) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5 flex items-start gap-4 hover:shadow-md transition-shadow">
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1">
          {label}
        </p>
        <p className="text-2xl font-bold text-gray-900 leading-tight">{value}</p>
        <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
      </div>
    </div>
  )
}
