import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { EmptyState } from './empty-state'
import { NumberText } from './display-text'
import { StatusBadge } from './status-badge'
import { PhoneFrame, StoryProvider } from './story-frames'
import type { TreeNode } from './tree-logic'
import {
  CHART_OF_ACCOUNTS,
  COURSE,
  LOCATIONS,
  LONG_CHART,
  LONG_NODES,
  ORG_UNITS,
  ZONE_B,
  type LocationFigures,
} from './tree-story-data'
import { TreeView, type TreeViewProps } from './tree-view'

/** The tree with the application around it: it loads zone B on demand. */
function Locations(
  props: Partial<TreeViewProps<LocationFigures>> & { fail?: boolean; never?: boolean },
) {
  const [nodes, setNodes] = useState(LOCATIONS)
  /** The application's answer for one node: its children, an error, or nothing yet. */
  const update = (id: string, change: Partial<TreeNode<LocationFigures>>) => {
    setNodes((current) =>
      current.map(function attach(node): TreeNode<LocationFigures> {
        if (node.id === id) {
          const next: TreeNode<LocationFigures> = { ...node, ...change }
          if (change.loadError === undefined) delete next.loadError
          return next
        }
        return node.children === undefined ? node : { ...node, children: node.children.map(attach) }
      }),
    )
  }
  const load = (id: string) => {
    if (props.never === true) return
    // Asking again clears the error: the loading row shows while the application waits.
    update(id, {})
    window.setTimeout(() => {
      update(
        id,
        props.fail === true
          ? { loadError: 'The locations of this zone could not be loaded.' }
          : { children: id === 'ns-b' ? ZONE_B : [] },
      )
    }, 400)
  }
  return (
    <TreeView
      label="Warehouse locations"
      nodes={nodes}
      defaultExpanded={['ns', 'ns-a']}
      onLoadChildren={load}
      end={(node) =>
        node.data === undefined ? null : (
          <span className="text-xs text-secondary">
            <NumberText value={node.data.free} /> of <NumberText value={node.data.places} /> free
          </span>
        )
      }
      {...props}
    />
  )
}

const meta = {
  title: 'Components/Tree/TreeView',
  component: TreeView,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** records in a hierarchy — a chart of accounts, warehouse locations, org ' +
          'units, a course’s structure. Each node with its code, name, a description line and, ' +
          'at its end, what the application puts there (`end`: a figure, a badge).\n\n' +
          '**Keyboard (WAI-ARIA tree):** ArrowDown / ArrowUp, Home / End; the arrow toward the ' +
          'trailing side opens a node or enters it, the other closes it or goes to its parent — ' +
          'mirrored in right-to-left; `*` opens all siblings; typing a name or a code jumps to ' +
          'it; Enter or Space selects (or opens and closes without selection).\n\n' +
          '**Lazy children:** a node with `hasChildren` and no `children` calls ' +
          '`onLoadChildren(id)` when opened; a loading row shows meanwhile, an error row with ' +
          '"Try again" when the node carries `loadError`.\n\n' +
          '**Selection:** `selectionMode` "single" (neutral selected row with its bar) or ' +
          '"multiple" (checkboxes; a branch shows all, none or mixed from the selected ids). ' +
          'Expanded and selected ids can be controlled. A node that cannot be selected says why ' +
          '(`disabledReason`).\n\n' +
          '**Long trees:** `maxHeight` scrolls the tree inside it and draws only the rows in ' +
          'view. **Phones:** 44px rows and 32px chevrons.\n\n' +
          '**When:** the hierarchy itself matters — where a node stands and what is under it.\n\n' +
          '**When not:** figures per node (TreeTable); a flat list that only groups (DataTable, ' +
          'Accordion); navigation between pages (module tabs, the launchpad).',
      },
    },
  },
  args: { nodes: CHART_OF_ACCOUNTS, label: 'Chart of accounts' },
  play: settle,
} satisfies Meta<typeof TreeView>

export default meta

type Story = StoryObj<typeof meta>

/** The chart of accounts (kontni plan): a class and a group open, one account selected. */
export const Default: Story = {
  name: 'Chart of accounts',
  render: () => (
    <div className="max-w-xl">
      <TreeView
        label="Chart of accounts"
        nodes={CHART_OF_ACCOUNTS}
        selectionMode="single"
        defaultExpanded={['2', '24']}
        defaultSelected={['241']}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const tree = canvas.getByRole('tree', { name: 'Chart of accounts' })
    const row = within(tree).getByRole('treeitem', { name: /Tekući \(poslovni\) računi/ })
    await expect(row).toHaveAttribute('aria-selected', 'true')
    await expect(row).toHaveAttribute('aria-level', '3')
    await expect(row).toHaveAttribute('aria-posinset', '1')
    await expect(row).toHaveAttribute('aria-setsize', '2')
    // The selected row is the one in the tab order.
    await expect(row).toHaveAttribute('tabindex', '0')
    await expect(within(tree).getByRole('treeitem', { name: /^2\s/ })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
  },
}

/** The keyboard: open, enter, go back, type-ahead, select with Enter. */
export const Keyboard: Story = {
  tags: ['interaction'],
  render: () => (
    <div className="max-w-xl">
      <TreeView label="Chart of accounts" nodes={CHART_OF_ACCOUNTS} selectionMode="single" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const rtl = getComputedStyle(canvas.getByRole('tree')).direction === 'rtl'
    const into = rtl ? '{ArrowLeft}' : '{ArrowRight}'
    const out = rtl ? '{ArrowRight}' : '{ArrowLeft}'
    const first = canvas.getByRole('treeitem', { name: /Stalna imovina/ })
    first.focus()
    await userEvent.keyboard('{ArrowDown}')
    const zalihe = canvas.getByRole('treeitem', { name: /Zalihe/ })
    await expect(zalihe).toHaveFocus()
    await userEvent.keyboard(into)
    await expect(zalihe).toHaveAttribute('aria-expanded', 'true')
    await userEvent.keyboard(into)
    await expect(canvas.getByRole('treeitem', { name: /Materijal$/ })).toHaveFocus()
    await userEvent.keyboard(out)
    await expect(zalihe).toHaveFocus()
    await userEvent.keyboard(out)
    await expect(zalihe).toHaveAttribute('aria-expanded', 'false')
    // Type-ahead by name, then by code.
    await userEvent.keyboard('k')
    await expect(canvas.getByRole('treeitem', { name: /Kratkoročna/ })).toHaveFocus()
    await userEvent.keyboard('*')
    await waitFor(async () => {
      await expect(canvas.getByRole('treeitem', { name: /Kapital/ })).toHaveAttribute(
        'aria-expanded',
        'true',
      )
    })
    await userEvent.keyboard('{End}')
    const last = canvas.getByRole('treeitem', { name: /Obaveze za zarade/ })
    await expect(last).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    await expect(last).toHaveAttribute('aria-selected', 'true')
    await userEvent.keyboard('{Home}')
    await expect(first).toHaveFocus()
  },
}

/** Warehouse locations: the free places at each row's end; zone B loads when opened. */
export const WarehouseLocations: Story = {
  name: 'Warehouse locations',
  render: () => (
    <div className="max-w-xl">
      <Locations />
    </div>
  ),
}

/** Opening zone B asks the application for its children; a loading row shows meanwhile. */
export const LazyLoading: Story = {
  name: 'Lazy loading, interaction',
  tags: ['interaction'],
  render: () => (
    <div className="max-w-xl">
      <Locations />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const zone = canvas.getByRole('treeitem', { name: /Zona B/ })
    await userEvent.click(zone)
    await expect(zone).toHaveAttribute('aria-expanded', 'true')
    await expect(canvas.getByRole('treeitem', { name: /Loading/ })).toBeVisible()
    await expect(await canvas.findByRole('treeitem', { name: /Komora B-01/ })).toBeVisible()
    await expect(canvas.queryByRole('treeitem', { name: /Loading/ })).toBeNull()
  },
}

/** A node opened while its children load: the loading row under it. */
export const Loading: Story = {
  name: 'Loading children',
  render: () => (
    <div className="max-w-xl">
      <Locations defaultExpanded={['ns', 'ns-b']} never />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const row = within(canvasElement).getByRole('treeitem', { name: /Loading/ })
    await expect(row).toHaveAttribute('aria-level', '3')
    await expect(row).toHaveAttribute('aria-busy', 'true')
  },
}

/** The whole tree loading: skeleton rows. */
export const LoadingTree: Story = {
  name: 'Loading',
  render: () => (
    <div className="max-w-xl">
      <TreeView label="Chart of accounts" nodes={[]} loading />
    </div>
  ),
}

/** The children could not be loaded: an error row with "Try again". */
export const LoadError: Story = {
  name: 'Error',
  render: () => (
    <div className="max-w-xl">
      <TreeView
        label="Warehouse locations"
        nodes={LOCATIONS.map((node) => ({
          ...node,
          children: (node.children ?? []).map((child): TreeNode<LocationFigures> =>
            child.id === 'ns-b'
              ? { ...child, loadError: 'The locations of this zone could not be loaded.' }
              : child.id === 'ns-y'
                ? { ...child, loadError: true }
                : child,
          ),
        }))}
        defaultExpanded={['ns', 'ns-b', 'ns-y']}
        onLoadChildren={() => undefined}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByText('The locations of this zone could not be loaded.')).toBeVisible()
    // Without the application's words, the provider's.
    await expect(canvas.getByText('The items could not be loaded.')).toBeVisible()
    await expect(canvas.getAllByRole('button', { name: 'Try again' })).toHaveLength(2)
  },
}

/** "Try again" asks for the children once more. */
export const RetryInteraction: Story = {
  name: 'Error, try again, interaction',
  tags: ['interaction'],
  render: () => (
    <div className="max-w-xl">
      <Locations fail />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('treeitem', { name: /Otvoreno skladište/ }))
    const error = await canvas.findByRole('treeitem', { name: /could not be loaded/ })
    await userEvent.click(within(error).getByRole('button', { name: 'Try again' }))
    await expect(canvas.getByRole('treeitem', { name: /Loading/ })).toBeVisible()
    await expect(await canvas.findByRole('treeitem', { name: /could not be loaded/ })).toBeVisible()
  },
}

/** Org units with checkboxes: a branch is checked, unchecked or mixed; a closed site says why. */
export const OrgUnits: Story = {
  name: 'Org units, multiple selection',
  render: () => (
    <div className="max-w-xl">
      <TreeView
        label="Org units"
        nodes={ORG_UNITS}
        selectionMode="multiple"
        defaultExpanded={['kg', 'finansije', 'proizvodnja']}
        defaultSelected={['racunovodstvo', 'kontroling', 'nabavka', 'finansije', 'liman']}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('treeitem', { name: /Sektor finansija/ })).toHaveAttribute(
      'aria-checked',
      'true',
    )
    await expect(canvas.getByRole('treeitem', { name: /Sektor proizvodnje/ })).toHaveAttribute(
      'aria-checked',
      'mixed',
    )
    await expect(canvas.getByText('Closed on 31.03.2026: no new assignments.')).toBeVisible()
  },
}

/** Checking a branch checks its units; its parent follows. */
export const OrgUnitsInteraction: Story = {
  name: 'Org units, multiple selection, interaction',
  tags: ['interaction'],
  render: function Render() {
    const [selected, setSelected] = useState<string[]>([])
    return (
      <div className="max-w-xl">
        <TreeView
          label="Org units"
          nodes={ORG_UNITS}
          selectionMode="multiple"
          defaultExpanded={['kg', 'finansije']}
          selected={selected}
          onSelectedChange={setSelected}
        />
        <p className="text-xs text-secondary">Selected: {selected.join(', ')}</p>
      </div>
    )
  },
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const finance = canvas.getByRole('treeitem', { name: /Sektor finansija/ })
    await userEvent.click(finance)
    await expect(finance).toHaveAttribute('aria-checked', 'true')
    await expect(canvas.getByRole('treeitem', { name: /Kontroling/ })).toHaveAttribute(
      'aria-checked',
      'true',
    )
    await expect(canvas.getByRole('treeitem', { name: /Kvadrat Gradnja/ })).toHaveAttribute(
      'aria-checked',
      'mixed',
    )
    await userEvent.keyboard(' ')
    await expect(finance).toHaveAttribute('aria-checked', 'false')
    await expect(canvas.getByText(/^Selected:\s*$/)).toBeVisible()
  },
}

/** A course's structure: modules and lessons with their kind and length; the next one locked. */
export const Course: Story = {
  name: 'Course structure',
  render: () => (
    <div className="max-w-xl">
      <TreeView
        label="Course outline"
        nodes={COURSE}
        selectionMode="single"
        defaultExpanded={['m1', 'm2']}
        defaultSelected={['l22']}
        end={(node) =>
          node.id === 'l11' || node.id === 'l12' || node.id === 'l13' || node.id === 'q1' ? (
            <StatusBadge label="Done" tone="success" />
          ) : null
        }
      />
    </div>
  ),
}

/** Expanded state controlled by the application (kept in the address, for example). */
export const Controlled: Story = {
  name: 'Controlled, interaction',
  tags: ['interaction'],
  render: function Render() {
    const [expanded, setExpanded] = useState<string[]>(['0'])
    return (
      <div className="max-w-xl">
        <TreeView
          label="Chart of accounts"
          nodes={CHART_OF_ACCOUNTS}
          expanded={expanded}
          onExpandedChange={setExpanded}
        />
        <p className="text-xs text-secondary">Expanded: {expanded.join(', ')}</p>
      </div>
    )
  },
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('treeitem', { name: /Zalihe/ }))
    await expect(canvas.getByText('Expanded: 0, 1')).toBeVisible()
  },
}

/** Nothing in the tree yet. */
export const Empty: Story = {
  render: () => (
    <div className="max-w-xl">
      <TreeView
        label="Warehouse locations"
        nodes={[]}
        empty={
          <EmptyState
            compact
            title="No locations yet"
            description="Add the warehouse's zones, aisles and racks."
          />
        }
      />
    </div>
  ),
}

/** Long names and reasons wrap; the chevron stays at the first line. */
export const LongText: Story = {
  name: 'Long text',
  render: () => (
    <div className="max-w-md">
      <TreeView
        label="Org units"
        nodes={LONG_NODES}
        selectionMode="multiple"
        defaultExpanded={['long']}
      />
    </div>
  ),
}

/** 5,110 accounts: the tree scrolls inside its height and draws only the rows in view. */
export const Thousands: Story = {
  name: 'Thousands of nodes',
  render: () => (
    <div className="max-w-xl">
      <TreeView
        label="Chart of accounts"
        nodes={LONG_CHART}
        selectionMode="single"
        defaultExpanded={LONG_CHART.flatMap((node) => [
          node.id,
          ...(node.children ?? []).map((child) => child.id),
        ])}
        maxHeight="400px"
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const tree = within(canvasElement).getByRole('tree')
    await expect(within(tree).getAllByRole('treeitem').length).toBeLessThan(120)
    await expect(within(tree).getByRole('treeitem', { name: /Klasa 0/ })).toHaveAttribute(
      'aria-setsize',
      '10',
    )
  },
}

/** Phone width: 44px rows, 32px chevrons, the indent 16px. */
export const PhoneWidth: Story = {
  name: 'Phone width',
  render: () => (
    <PhoneFrame>
      <div className="p-4">
        <Locations layout="phone" defaultExpanded={['ns', 'ns-a', 'ns-a-01']} />
      </div>
    </PhoneFrame>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const rows = within(canvasElement).getAllByRole('treeitem')
    for (const row of rows) {
      await expect(row.getBoundingClientRect().height).toBeGreaterThanOrEqual(44)
    }
  },
}

/** Arabic: the tree from the right, chevrons pointing left. */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <div className="max-w-xl">
        <TreeView
          label="دليل الحسابات"
          selectionMode="single"
          defaultExpanded={['1', '11']}
          defaultSelected={['112']}
          nodes={[
            {
              id: '1',
              code: '1',
              label: 'الأصول',
              children: [
                {
                  id: '11',
                  code: '11',
                  label: 'الأصول المتداولة',
                  children: [
                    { id: '111', code: '111', label: 'النقدية في الصندوق', children: [] },
                    { id: '112', code: '112', label: 'الحسابات المصرفية', children: [] },
                  ],
                },
                { id: '12', code: '12', label: 'الأصول الثابتة', hasChildren: true },
              ],
            },
            { id: '2', code: '2', label: 'الخصوم', hasChildren: true },
          ]}
        />
      </div>
    </StoryProvider>
  ),
}

/** Japanese. */
export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja">
      <div className="max-w-xl">
        <TreeView
          label="勘定科目"
          selectionMode="multiple"
          defaultExpanded={['1', '11']}
          defaultSelected={['111']}
          nodes={[
            {
              id: '1',
              code: '1',
              label: '資産',
              children: [
                {
                  id: '11',
                  code: '11',
                  label: '流動資産',
                  children: [
                    { id: '111', code: '111', label: '現金', children: [] },
                    { id: '112', code: '112', label: '普通預金', children: [] },
                  ],
                },
                { id: '12', code: '12', label: '固定資産', hasChildren: true },
              ],
            },
            { id: '2', code: '2', label: '負債', hasChildren: true },
          ]}
        />
      </div>
    </StoryProvider>
  ),
}
