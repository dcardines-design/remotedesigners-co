'use client'

import { useState, useRef, useEffect } from 'react'
import { Input, Button, Checkbox, Select, RainbowButton } from '@/components/ui'
import { toast } from 'sonner'

// Simple Combobox for demo
function DemoCombobox() {
  const [search, setSearch] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [selected, setSelected] = useState<string[]>([])
  const dropdownRef = useRef<HTMLDivElement>(null)

  const options = [
    { value: 'product-design', label: 'Product Design', emoji: '🎯' },
    { value: 'ux-design', label: 'UX Design', emoji: '🔬' },
    { value: 'ui-design', label: 'UI Design', emoji: '🎨' },
    { value: 'visual-design', label: 'Visual Design', emoji: '👁️' },
    { value: 'brand-design', label: 'Brand Design', emoji: '✨' },
  ]

  const filteredOptions = options.filter(opt =>
    !selected.includes(opt.value) &&
    opt.label.toLowerCase().includes(search.toLowerCase())
  )

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="space-y-2">
      <span className="text-sm font-medium text-neutral-700">
        Job Types {selected.length > 0 && `(${selected.length})`}
      </span>
      <div className="relative" ref={dropdownRef}>
        <input
          type="text"
          placeholder="Search job types..."
          value={search}
          onChange={e => { setSearch(e.target.value); setIsOpen(true) }}
          onFocus={() => setIsOpen(true)}
          className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2.5 pr-9 text-sm text-neutral-900 placeholder:text-neutral-400 hover:border-neutral-300 transition-all focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400"
        />
        <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
        {isOpen && filteredOptions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-[0px_2px_0px_0px_rgba(0,0,0,0.08)] max-h-48 overflow-y-auto">
            {filteredOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => { setSelected([...selected, opt.value]); setSearch(''); setIsOpen(false) }}
                className="w-full px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 transition-colors flex items-center gap-2"
              >
                <span>{opt.emoji}</span>
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {selected.map(val => {
            const option = options.find(o => o.value === val)
            return (
              <button
                key={val}
                onClick={() => setSelected(selected.filter(s => s !== val))}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-neutral-800 text-white rounded-md border border-neutral-800 shadow-[0px_2px_0px_0px_rgba(0,0,0,0.3)] hover:shadow-[0px_1px_0px_0px_rgba(0,0,0,0.3)] hover:translate-y-[1px] transition-all"
              >
                {option?.emoji} {option?.label}
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// Simple Dropdown for demo
function DemoDropdown() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-900 bg-white border border-neutral-200 rounded-lg shadow-[0px_2px_0px_0px_rgba(0,0,0,0.05)] hover:shadow-[0px_1px_0px_0px_rgba(0,0,0,0.05)] hover:translate-y-[1px] transition-all"
      >
        <span>user@example.com</span>
        <svg className={`w-4 h-4 text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-1 w-full min-w-[180px] bg-white border border-neutral-200 rounded-lg shadow-[0px_2px_0px_0px_rgba(0,0,0,0.08)] z-20 overflow-hidden">
            <button className="w-full px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 transition-colors">
              Saved Jobs
            </button>
            <button className="w-full px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 transition-colors">
              Jobs Posted
            </button>
            <div className="border-t border-neutral-100" />
            <button className="w-full px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 transition-colors">
              Logout
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default function DesignSystemPage() {
  const [inputValue, setInputValue] = useState('')
  const [checked, setChecked] = useState(false)
  const [selectValue, setSelectValue] = useState('')

  return (
    <div className="min-h-screen bg-neutral-50 py-16">
      <div className="max-w-5xl mx-auto px-8">
        <h1 className="text-4xl font-medium text-neutral-900 mb-2 tracking-tight">Design System</h1>
        <p className="text-neutral-500 mb-12">Components, tokens, and styles for remotedesigners.co</p>

        {/* Table of Contents */}
        <nav className="mb-16 p-6 bg-white rounded-xl border border-neutral-200">
          <h2 className="text-sm font-medium text-neutral-900 mb-3">Contents</h2>
          <div className="flex flex-wrap gap-2">
            {['Colors', 'Typography', 'Spacing', 'Border Radius', 'Shadows', 'Buttons', 'Inputs', 'Select', 'Combobox', 'Dropdown', 'Checkbox', 'Cards', 'Chips', 'Toasts'].map(section => (
              <a
                key={section}
                href={`#${section.toLowerCase().replace(' ', '-')}`}
                className="text-sm text-neutral-500 hover:text-neutral-900 px-3 py-1.5 rounded-md hover:bg-neutral-100 transition-colors"
              >
                {section}
              </a>
            ))}
          </div>
        </nav>

        {/* Colors */}
        <section id="colors" className="mb-16">
          <h2 className="text-2xl font-medium text-neutral-900 mb-6">Colors</h2>

          {/* Neutrals */}
          <div className="mb-8">
            <h3 className="text-sm font-medium text-neutral-700 mb-4">Neutrals</h3>
            <div className="grid grid-cols-6 gap-3">
              {[
                { name: 'neutral-950', hex: '#0a0a0a', text: 'white' },
                { name: 'neutral-900', hex: '#171717', text: 'white' },
                { name: 'neutral-700', hex: '#404040', text: 'white' },
                { name: 'neutral-600', hex: '#525252', text: 'white' },
                { name: 'neutral-500', hex: '#737373', text: 'white' },
                { name: 'neutral-400', hex: '#a3a3a3', text: 'black' },
                { name: 'neutral-300', hex: '#d4d4d4', text: 'black' },
                { name: 'neutral-200', hex: '#e5e5e5', text: 'black' },
                { name: 'neutral-100', hex: '#f5f5f5', text: 'black' },
                { name: 'neutral-50', hex: '#fafafa', text: 'black' },
                { name: 'white', hex: '#ffffff', text: 'black' },
              ].map(color => (
                <div key={color.name}>
                  <div
                    className={`w-full h-14 rounded-lg mb-2 flex items-end p-2 ${color.name === 'white' || color.name.includes('50') || color.name.includes('100') || color.name.includes('200') ? 'border border-neutral-200' : ''}`}
                    style={{ backgroundColor: color.hex }}
                  >
                    <span className="text-[10px] font-mono" style={{ color: color.text }}>{color.hex}</span>
                  </div>
                  <p className="text-xs text-neutral-600">{color.name}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Accent Colors */}
          <div className="mb-8">
            <h3 className="text-sm font-medium text-neutral-700 mb-4">Accent Colors</h3>
            <div className="grid grid-cols-6 gap-3">
              {[
                { name: 'green-500', hex: '#22c55e', text: 'white', usage: 'Success, NEW badge' },
                { name: 'green-600', hex: '#16a34a', text: 'white', usage: 'Success hover' },
                { name: 'yellow-400', hex: '#facc15', text: 'black', usage: 'Featured badge' },
                { name: 'amber-500', hex: '#f59e0b', text: 'black', usage: 'Warning' },
                { name: 'red-500', hex: '#ef4444', text: 'white', usage: 'Error, Delete' },
                { name: 'pink-600', hex: '#db2777', text: 'white', usage: 'CTA, Premium' },
              ].map(color => (
                <div key={color.name}>
                  <div
                    className="w-full h-14 rounded-lg mb-2 flex items-end p-2"
                    style={{ backgroundColor: color.hex }}
                  >
                    <span className="text-[10px] font-mono" style={{ color: color.text }}>{color.hex}</span>
                  </div>
                  <p className="text-xs text-neutral-600">{color.name}</p>
                  <p className="text-[10px] text-neutral-400">{color.usage}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Status Colors */}
          <div>
            <h3 className="text-sm font-medium text-neutral-700 mb-4">Status Colors</h3>
            <div className="grid grid-cols-4 gap-3">
              {[
                { name: 'Success', bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800' },
                { name: 'Warning', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800' },
                { name: 'Error', bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800' },
                { name: 'Info', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800' },
              ].map(status => (
                <div key={status.name} className={`p-4 rounded-lg border ${status.bg} ${status.border}`}>
                  <p className={`text-sm font-medium ${status.text}`}>{status.name}</p>
                  <p className="text-xs text-neutral-500 mt-1">{status.bg} {status.border}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Typography */}
        <section id="typography" className="mb-16">
          <h2 className="text-2xl font-medium text-neutral-900 mb-6">Typography</h2>

          {/* Font Family */}
          <div className="mb-8 bg-white rounded-xl border border-neutral-200 p-6">
            <h3 className="text-sm font-medium text-neutral-700 mb-4">Font Family</h3>
            <div className="space-y-4">
              <div>
                <p className="text-neutral-900">Inter (Primary)</p>
                <p className="text-xs text-neutral-400 font-mono">font-family: Inter, system-ui, sans-serif</p>
              </div>
              <div>
                <p className="text-neutral-900 font-[var(--font-dm-sans)]">DM Sans (Display)</p>
                <p className="text-xs text-neutral-400 font-mono">font-family: var(--font-dm-sans)</p>
              </div>
            </div>
          </div>

          {/* Font Sizes */}
          <div className="mb-8 bg-white rounded-xl border border-neutral-200 p-6">
            <h3 className="text-sm font-medium text-neutral-700 mb-4">Font Sizes</h3>
            <div className="space-y-4">
              {[
                { class: 'text-4xl', size: '36px', line: '40px', usage: 'Page headings' },
                { class: 'text-3xl', size: '30px', line: '36px', usage: 'Large headings' },
                { class: 'text-2xl', size: '24px', line: '32px', usage: 'Section headings' },
                { class: 'text-xl', size: '20px', line: '28px', usage: 'Card titles' },
                { class: 'text-lg', size: '18px', line: '28px', usage: 'Large body text' },
                { class: 'text-base', size: '16px', line: '24px', usage: 'Body text' },
                { class: 'text-sm', size: '14px', line: '20px', usage: 'Secondary text, buttons' },
                { class: 'text-xs', size: '12px', line: '16px', usage: 'Captions, labels' },
                { class: 'text-[10px]', size: '10px', line: '14px', usage: 'Micro text, badges' },
              ].map(font => (
                <div key={font.class} className="flex items-baseline gap-6 border-b border-neutral-100 pb-3">
                  <div className="w-24">
                    <p className="text-xs font-mono text-neutral-400">{font.class}</p>
                  </div>
                  <div className="w-24">
                    <p className="text-xs text-neutral-500">{font.size} / {font.line}</p>
                  </div>
                  <p className={`${font.class} text-neutral-900`}>The quick brown fox</p>
                  <p className="text-xs text-neutral-400 ml-auto">{font.usage}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Font Weights */}
          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            <h3 className="text-sm font-medium text-neutral-700 mb-4">Font Weights</h3>
            <div className="space-y-3">
              {[
                { class: 'font-normal', weight: '400', usage: 'Body text' },
                { class: 'font-medium', weight: '500', usage: 'Headings, labels, buttons' },
                { class: 'font-semibold', weight: '600', usage: 'Emphasis' },
                { class: 'font-bold', weight: '700', usage: 'Strong emphasis' },
              ].map(w => (
                <div key={w.class} className="flex items-center gap-6">
                  <p className="text-xs font-mono text-neutral-400 w-28">{w.class}</p>
                  <p className="text-xs text-neutral-500 w-12">{w.weight}</p>
                  <p className={`text-lg ${w.class} text-neutral-900`}>Remote Designers</p>
                  <p className="text-xs text-neutral-400 ml-auto">{w.usage}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Spacing */}
        <section id="spacing" className="mb-16">
          <h2 className="text-2xl font-medium text-neutral-900 mb-6">Spacing</h2>
          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            <div className="space-y-3">
              {[
                { class: '1', px: '4px' },
                { class: '1.5', px: '6px' },
                { class: '2', px: '8px' },
                { class: '2.5', px: '10px' },
                { class: '3', px: '12px' },
                { class: '4', px: '16px' },
                { class: '5', px: '20px' },
                { class: '6', px: '24px' },
                { class: '8', px: '32px' },
                { class: '10', px: '40px' },
                { class: '12', px: '48px' },
                { class: '16', px: '64px' },
              ].map(space => (
                <div key={space.class} className="flex items-center gap-4">
                  <p className="text-xs font-mono text-neutral-400 w-16">gap-{space.class}</p>
                  <p className="text-xs text-neutral-500 w-12">{space.px}</p>
                  <div className="h-4 bg-pink-500 rounded" style={{ width: space.px }}></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Border Radius */}
        <section id="border-radius" className="mb-16">
          <h2 className="text-2xl font-medium text-neutral-900 mb-6">Border Radius</h2>
          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            <div className="flex flex-wrap gap-6">
              {[
                { class: 'rounded', px: '4px' },
                { class: 'rounded-md', px: '6px' },
                { class: 'rounded-lg', px: '8px' },
                { class: 'rounded-xl', px: '12px' },
                { class: 'rounded-2xl', px: '16px' },
                { class: 'rounded-full', px: '9999px' },
              ].map(radius => (
                <div key={radius.class} className="text-center">
                  <div className={`w-16 h-16 bg-neutral-900 ${radius.class} mb-2`}></div>
                  <p className="text-xs font-mono text-neutral-600">{radius.class}</p>
                  <p className="text-[10px] text-neutral-400">{radius.px}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Shadows */}
        <section id="shadows" className="mb-16">
          <h2 className="text-2xl font-medium text-neutral-900 mb-6">3D Shadows</h2>
          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            <div className="grid grid-cols-4 gap-4">
              {[
                { name: 'Card Light', shadow: '0px_2px_0px_0px_rgba(0,0,0,0.03)', bg: 'bg-white' },
                { name: 'Card', shadow: '0px_4px_0px_0px_rgba(0,0,0,0.03)', bg: 'bg-white' },
                { name: 'Interactive', shadow: '0px_2px_0px_0px_rgba(0,0,0,0.05)', bg: 'bg-white' },
                { name: 'Hover', shadow: '0px_4px_0px_0px_rgba(0,0,0,0.08)', bg: 'bg-white' },
                { name: 'Button Primary', shadow: '0px_3px_0px_0px_rgba(0,0,0,0.3)', bg: 'bg-neutral-900 text-white' },
                { name: 'Button Pressed', shadow: '0px_1px_0px_0px_rgba(0,0,0,0.3)', bg: 'bg-neutral-900 text-white' },
              ].map(s => (
                <div key={s.name} className="text-center">
                  <div
                    className={`p-6 rounded-lg border border-neutral-200 mb-2 ${s.bg}`}
                    style={{ boxShadow: s.shadow.split('_').join(' ') }}
                  >
                    <p className="text-xs">{s.name}</p>
                  </div>
                  <p className="text-[10px] font-mono text-neutral-400 break-all">{s.shadow}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Buttons */}
        <section id="buttons" className="mb-16">
          <h2 className="text-2xl font-medium text-neutral-900 mb-6">Buttons</h2>
          <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-6">
            <div>
              <p className="text-xs text-neutral-400 mb-3">Primary</p>
              <div className="flex gap-3 items-center">
                <Button variant="primary" size="sm">Small</Button>
                <Button variant="primary" size="md">Medium</Button>
                <Button variant="primary" size="lg">Large</Button>
                <Button variant="primary" disabled>Disabled</Button>
              </div>
            </div>
            <div>
              <p className="text-xs text-neutral-400 mb-3">Secondary</p>
              <div className="flex gap-3 items-center">
                <Button variant="secondary" size="sm">Small</Button>
                <Button variant="secondary" size="md">Medium</Button>
                <Button variant="secondary" size="lg">Large</Button>
                <Button variant="secondary" disabled>Disabled</Button>
              </div>
            </div>
            <div>
              <p className="text-xs text-neutral-400 mb-3">Outline</p>
              <div className="flex gap-3 items-center">
                <Button variant="outline" size="sm">Small</Button>
                <Button variant="outline" size="md">Medium</Button>
                <Button variant="outline" size="lg">Large</Button>
                <Button variant="outline" disabled>Disabled</Button>
              </div>
            </div>
            <div>
              <p className="text-xs text-neutral-400 mb-3">Ghost</p>
              <div className="flex gap-3 items-center">
                <Button variant="ghost" size="sm">Small</Button>
                <Button variant="ghost" size="md">Medium</Button>
                <Button variant="ghost" size="lg">Large</Button>
                <Button variant="ghost" disabled>Disabled</Button>
              </div>
            </div>
            <div>
              <p className="text-xs text-neutral-400 mb-3">Rainbow (CTA)</p>
              <div className="flex gap-3 items-center">
                <RainbowButton>Get Membership</RainbowButton>
                <RainbowButton disabled>Disabled</RainbowButton>
              </div>
            </div>
            <div>
              <p className="text-xs text-neutral-400 mb-3">Shimmering CTA (Navbar)</p>
              <div className="flex gap-3 items-center">
                <button
                  className="relative px-4 py-2 text-sm font-medium text-white bg-pink-600 border border-pink-700 rounded-md shadow-[0px_2px_0px_0px_#9d174d] hover:translate-y-[1px] hover:shadow-[0px_1px_0px_0px_#9d174d] active:translate-y-[2px] active:shadow-none transition-all overflow-hidden"
                >
                  <span
                    className="absolute animate-get-pro-shine"
                    style={{
                      inset: '-100%',
                      width: '300%',
                      backgroundImage: 'linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.2) 40%, rgba(255,255,255,0.2) 45%, transparent 45%, transparent 47%, rgba(255,255,255,0.15) 47%, rgba(255,255,255,0.15) 48%, transparent 48%)',
                    }}
                  />
                  <span className="relative z-10">Get Membership</span>
                </button>
              </div>
            </div>
            <div>
              <p className="text-xs text-neutral-400 mb-3">Full Width</p>
              <Button variant="primary" fullWidth>Full Width Button</Button>
            </div>
          </div>
        </section>

        {/* Inputs */}
        <section id="inputs" className="mb-16">
          <h2 className="text-2xl font-medium text-neutral-900 mb-6">Inputs</h2>
          <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-6">
            <div className="grid grid-cols-2 gap-6">
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
                  placeholder="Enter password"
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
          </div>
        </section>

        {/* Select */}
        <section id="select" className="mb-16">
          <h2 className="text-2xl font-medium text-neutral-900 mb-6">Select</h2>
          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-neutral-400 mb-3">Default</p>
                <Select
                  label="Job Type"
                  value={selectValue}
                  onChange={setSelectValue}
                  options={[
                    { value: '', label: 'Select...' },
                    { value: 'full-time', label: 'Full Time' },
                    { value: 'part-time', label: 'Part Time' },
                    { value: 'contract', label: 'Contract' },
                  ]}
                />
              </div>
              <div>
                <p className="text-xs text-neutral-400 mb-3">Required</p>
                <Select
                  label="Experience Level *"
                  value="senior"
                  onChange={() => {}}
                  options={[
                    { value: 'junior', label: 'Junior' },
                    { value: 'mid', label: 'Mid-Level' },
                    { value: 'senior', label: 'Senior' },
                  ]}
                  required
                />
              </div>
            </div>
          </div>
        </section>

        {/* Combobox */}
        <section id="combobox" className="mb-16">
          <h2 className="text-2xl font-medium text-neutral-900 mb-6">Combobox (Multi-Select)</h2>
          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            <div className="max-w-sm">
              <p className="text-xs text-neutral-400 mb-3">Searchable with tags</p>
              <DemoCombobox />
            </div>
          </div>
        </section>

        {/* Dropdown */}
        <section id="dropdown" className="mb-16">
          <h2 className="text-2xl font-medium text-neutral-900 mb-6">Dropdown Menu</h2>
          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            <p className="text-xs text-neutral-400 mb-3">User menu dropdown</p>
            <DemoDropdown />
          </div>
        </section>

        {/* Checkbox */}
        <section id="checkbox" className="mb-16">
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
        <section id="cards" className="mb-16">
          <h2 className="text-2xl font-medium text-neutral-900 mb-6">Cards</h2>
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-[0px_4px_0px_0px_rgba(0,0,0,0.03)]">
              <p className="text-xs text-neutral-400 mb-2">Default Card</p>
              <p className="text-neutral-600">bg-white rounded-xl border border-neutral-200 shadow-[0px_4px_0px_0px_rgba(0,0,0,0.03)]</p>
            </div>
            <div className="bg-white rounded-xl border border-neutral-200 p-6 hover:border-neutral-300 hover:shadow-[0px_4px_0px_0px_rgba(0,0,0,0.08)] transition-all cursor-pointer">
              <p className="text-xs text-neutral-400 mb-2">Hoverable Card</p>
              <p className="text-neutral-600">hover:border-neutral-300 hover:shadow-[0px_4px_0px_0px_rgba(0,0,0,0.08)]</p>
            </div>
            <div className="bg-amber-50 rounded-xl border border-amber-200 p-6">
              <p className="text-xs text-amber-600 mb-2">Featured Card</p>
              <p className="text-neutral-600">bg-amber-50 border-amber-200</p>
            </div>
          </div>
        </section>

        {/* Chips/Tags */}
        <section id="chips" className="mb-16">
          <h2 className="text-2xl font-medium text-neutral-900 mb-6">Chips & Badges</h2>
          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            <div className="flex flex-wrap gap-3 items-center">
              <span className="bg-white text-neutral-600 text-xs px-2.5 py-1 rounded border border-neutral-200 hover:shadow-[0px_2px_0px_0px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all cursor-pointer">
                Default Chip
              </span>
              <span className="bg-green-500 text-white text-[10px] font-medium tracking-wider px-2 py-0.5 rounded">
                NEW
              </span>
              <span className="bg-yellow-400 text-neutral-900 text-xs font-medium px-2.5 py-1 rounded border border-yellow-500">
                Featured
              </span>
              <span className="bg-neutral-800 text-white text-xs px-2.5 py-1 rounded">
                Selected
              </span>
              <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full">
                Remote
              </span>
              <span className="bg-pink-100 text-pink-700 text-xs font-medium px-2.5 py-1 rounded-full border border-pink-200">
                Premium
              </span>
            </div>
          </div>
        </section>

        {/* Toasts */}
        <section id="toasts" className="mb-16">
          <h2 className="text-2xl font-medium text-neutral-900 mb-6">Toasts</h2>
          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            <div className="flex flex-wrap gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => toast('Default toast message')}
              >
                Default
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => toast.success('Success! Action completed.')}
              >
                Success
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => toast.error('Error! Something went wrong.')}
              >
                Error
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => toast('With description', { description: 'This is a longer description text.' })}
              >
                With Description
              </Button>
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}
