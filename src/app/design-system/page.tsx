'use client'

import { useState } from 'react'
import { Input, Button, Checkbox } from '@/components/ui'

export default function DesignSystemPage() {
  const [inputValue, setInputValue] = useState('')
  const [checked, setChecked] = useState(false)

  return (
    <div className="min-h-screen bg-neutral-50 py-16">
      <div className="max-w-4xl mx-auto px-8">
        <h1 className="text-4xl font-medium text-neutral-900 mb-2 tracking-tight">Design System</h1>
        <p className="text-neutral-500 mb-12">Components and styles for remotedesigners.co</p>

        {/* Colors */}
        <section className="mb-16">
          <h2 className="text-2xl font-medium text-neutral-900 mb-6">Colors</h2>
          <div className="grid grid-cols-5 gap-4">
            <div>
              <div className="w-full h-16 rounded-lg bg-neutral-900 mb-2"></div>
              <p className="text-sm text-neutral-600">neutral-900</p>
            </div>
            <div>
              <div className="w-full h-16 rounded-lg bg-neutral-700 mb-2"></div>
              <p className="text-sm text-neutral-600">neutral-700</p>
            </div>
            <div>
              <div className="w-full h-16 rounded-lg bg-neutral-500 mb-2"></div>
              <p className="text-sm text-neutral-600">neutral-500</p>
            </div>
            <div>
              <div className="w-full h-16 rounded-lg bg-neutral-200 border border-neutral-300 mb-2"></div>
              <p className="text-sm text-neutral-600">neutral-200</p>
            </div>
            <div>
              <div className="w-full h-16 rounded-lg bg-neutral-50 border border-neutral-200 mb-2"></div>
              <p className="text-sm text-neutral-600">neutral-50</p>
            </div>
          </div>
        </section>

        {/* Typography */}
        <section className="mb-16">
          <h2 className="text-2xl font-medium text-neutral-900 mb-6">Typography</h2>
          <div className="space-y-4 bg-white rounded-xl border border-neutral-200 p-6">
            <div>
              <p className="text-xs text-neutral-400 mb-1">text-4xl font-medium tracking-tight</p>
              <p className="text-4xl font-medium text-neutral-900 tracking-tight">Page Heading</p>
            </div>
            <div>
              <p className="text-xs text-neutral-400 mb-1">text-2xl font-medium</p>
              <p className="text-2xl font-medium text-neutral-900">Section Heading</p>
            </div>
            <div>
              <p className="text-xs text-neutral-400 mb-1">text-lg font-medium</p>
              <p className="text-lg font-medium text-neutral-900">Card Title</p>
            </div>
            <div>
              <p className="text-xs text-neutral-400 mb-1">text-sm text-neutral-600</p>
              <p className="text-sm text-neutral-600">Body text and descriptions</p>
            </div>
            <div>
              <p className="text-xs text-neutral-400 mb-1">text-xs text-neutral-400</p>
              <p className="text-xs text-neutral-400">Helper text and captions</p>
            </div>
          </div>
        </section>

        {/* Buttons */}
        <section className="mb-16">
          <h2 className="text-2xl font-medium text-neutral-900 mb-6">Buttons</h2>
          <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-6">
            <div>
              <p className="text-xs text-neutral-400 mb-3">Primary</p>
              <div className="flex gap-3">
                <Button variant="primary" size="sm">Small</Button>
                <Button variant="primary" size="md">Medium</Button>
                <Button variant="primary" size="lg">Large</Button>
                <Button variant="primary" disabled>Disabled</Button>
              </div>
            </div>
            <div>
              <p className="text-xs text-neutral-400 mb-3">Secondary</p>
              <div className="flex gap-3">
                <Button variant="secondary" size="sm">Small</Button>
                <Button variant="secondary" size="md">Medium</Button>
                <Button variant="secondary" size="lg">Large</Button>
                <Button variant="secondary" disabled>Disabled</Button>
              </div>
            </div>
            <div>
              <p className="text-xs text-neutral-400 mb-3">Outline</p>
              <div className="flex gap-3">
                <Button variant="outline" size="sm">Small</Button>
                <Button variant="outline" size="md">Medium</Button>
                <Button variant="outline" size="lg">Large</Button>
                <Button variant="outline" disabled>Disabled</Button>
              </div>
            </div>
            <div>
              <p className="text-xs text-neutral-400 mb-3">Ghost</p>
              <div className="flex gap-3">
                <Button variant="ghost" size="sm">Small</Button>
                <Button variant="ghost" size="md">Medium</Button>
                <Button variant="ghost" size="lg">Large</Button>
                <Button variant="ghost" disabled>Disabled</Button>
              </div>
            </div>
            <div>
              <p className="text-xs text-neutral-400 mb-3">Full Width</p>
              <Button variant="primary" fullWidth>Full Width Button</Button>
            </div>
          </div>
        </section>

        {/* Inputs */}
        <section className="mb-16">
          <h2 className="text-2xl font-medium text-neutral-900 mb-6">Inputs</h2>
          <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-6">
            <div>
              <p className="text-xs text-neutral-400 mb-3">Default</p>
              <Input
                label="Email"
                placeholder="you@example.com"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
            </div>
            <div>
              <p className="text-xs text-neutral-400 mb-3">With Hint</p>
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                hint="Must be at least 8 characters"
              />
            </div>
            <div>
              <p className="text-xs text-neutral-400 mb-3">With Error</p>
              <Input
                label="Email"
                placeholder="you@example.com"
                error="Please enter a valid email address"
              />
            </div>
            <div>
              <p className="text-xs text-neutral-400 mb-3">Disabled</p>
              <Input
                label="Email"
                placeholder="you@example.com"
                disabled
              />
            </div>
          </div>
        </section>

        {/* Checkbox */}
        <section className="mb-16">
          <h2 className="text-2xl font-medium text-neutral-900 mb-6">Checkbox</h2>
          <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-4">
            <Checkbox
              label="Default checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
            />
            <Checkbox
              label="Checked checkbox"
              checked={true}
              onChange={() => {}}
            />
            <Checkbox
              label="Disabled checkbox"
              disabled
            />
          </div>
        </section>

        {/* Cards */}
        <section className="mb-16">
          <h2 className="text-2xl font-medium text-neutral-900 mb-6">Cards</h2>
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-[0px_4px_0px_0px_rgba(0,0,0,0.03)]">
              <p className="text-xs text-neutral-400 mb-2">Default Card</p>
              <p className="text-neutral-600">shadow-[0px_4px_0px_0px_rgba(0,0,0,0.03)]</p>
            </div>
            <div className="bg-white rounded-xl border border-neutral-200 p-6 hover:border-neutral-300 hover:shadow-[0px_4px_0px_0px_rgba(0,0,0,0.08),0px_1px_2px_0px_rgba(0,0,0,0.05)] transition-all cursor-pointer">
              <p className="text-xs text-neutral-400 mb-2">Hoverable Card</p>
              <p className="text-neutral-600">hover:shadow-[0px_4px_0px_0px_rgba(0,0,0,0.08)]</p>
            </div>
          </div>
        </section>

        {/* Chips/Tags */}
        <section className="mb-16">
          <h2 className="text-2xl font-medium text-neutral-900 mb-6">Chips</h2>
          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            <div className="flex flex-wrap gap-2">
              <span className="bg-white text-neutral-600 text-xs px-2.5 py-1 rounded border border-neutral-200 hover:shadow-[0px_2px_0px_0px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all cursor-pointer">
                Default Chip
              </span>
              <span className="bg-green-500 text-white text-[10px] font-medium tracking-wider px-2 py-0.5 rounded">
                NEW
              </span>
              <span className="bg-yellow-400 text-neutral-900 text-xs font-medium px-2.5 py-1 rounded border border-yellow-500">
                Featured
              </span>
              <span className="bg-neutral-900 text-white text-xs px-2.5 py-1 rounded">
                Selected
              </span>
            </div>
          </div>
        </section>

        {/* Shadows */}
        <section className="mb-16">
          <h2 className="text-2xl font-medium text-neutral-900 mb-6">3D Shadows</h2>
          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-neutral-100 rounded-lg shadow-[0px_2px_0px_0px_rgba(0,0,0,0.05)] text-center">
                <p className="text-xs text-neutral-500">Light</p>
                <p className="text-[10px] text-neutral-400 mt-1">0px_2px_0px</p>
              </div>
              <div className="p-4 bg-neutral-100 rounded-lg shadow-[0px_3px_0px_0px_rgba(0,0,0,0.1)] text-center">
                <p className="text-xs text-neutral-500">Medium</p>
                <p className="text-[10px] text-neutral-400 mt-1">0px_3px_0px</p>
              </div>
              <div className="p-4 bg-neutral-900 text-white rounded-lg shadow-[0px_4px_0px_0px_rgba(0,0,0,0.3)] text-center">
                <p className="text-xs">Heavy</p>
                <p className="text-[10px] text-neutral-400 mt-1">0px_4px_0px</p>
              </div>
            </div>
          </div>
        </section>

        {/* Spacing */}
        <section className="mb-16">
          <h2 className="text-2xl font-medium text-neutral-900 mb-6">Spacing</h2>
          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <div className="w-2 h-4 bg-neutral-900"></div>
                <span className="text-sm text-neutral-600">gap-2 (8px)</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-3 h-4 bg-neutral-900"></div>
                <span className="text-sm text-neutral-600">gap-3 (12px)</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-4 h-4 bg-neutral-900"></div>
                <span className="text-sm text-neutral-600">gap-4 (16px)</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-6 h-4 bg-neutral-900"></div>
                <span className="text-sm text-neutral-600">gap-6 (24px)</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-8 h-4 bg-neutral-900"></div>
                <span className="text-sm text-neutral-600">gap-8 (32px)</span>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}
