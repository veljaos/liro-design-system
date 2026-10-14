import { CalendarClock, Eye, Globe, Mail, PenLine, Search, Undo2 } from 'lucide-react'
import { useContext, useState, type ReactNode } from 'react'
import {
  ActionGroup,
  ArticleList,
  ArticlePage,
  Banner,
  Button,
  ConfirmDialog,
  DataTable,
  DateField,
  Dialog,
  EmptyState,
  FileDropzone,
  FormFullWidth,
  FormSection,
  ListPage,
  MultiSelectField,
  NewsletterSignup,
  notice,
  PageContents,
  PortalShell,
  RecordFormPage,
  SearchResultList,
  SelectField,
  ShareLinks,
  snippetFromRanges,
  TextAreaField,
  TextField,
  Toaster,
  useLiro,
  type ActionItem,
  type ArticleSummary,
  type DataTableColumn,
  type SearchResult,
} from '@veljaos/ui'
import {
  isRichTextEmpty,
  RichText,
  RichTextField,
  richTextHeadings,
} from '../../../../packages/ui/src/rich-text'
import type { ExampleRoute } from './example-app'
import { Navigate, Shell, statusBadge } from './example-shell'
import { useExampleState } from './example-state'
import { Frame, Tenant } from './screens-G'
import {
  AC_ROUTES,
  AC_TODAY,
  AUTHORS,
  BLOG_URL,
  CATEGORIES,
  categoryLabel,
  EDITOR,
  findPost,
  matchRanges,
  NEWSLETTER,
  POSTS,
  PUBLISHED,
  searchPosts,
  TAGS,
  tagLabel,
  TIME_OPTIONS,
  type Post,
} from './data-AC'

/*
 * Group AC (P5.39): Liro's public blog — the list with categories, tags and search, the article
 * as a reading layout (ArticlePage: RichText, contents, related articles, share, newsletter) —
 * and its authoring for the Liro team (RecordFormPage on RichTextField: cover, slug, search
 * engine title and description, category and tags, Draft / Scheduled / Published, preview,
 * schedule). Covers are drawings in the tokens' colours, never images.
 */

const LINK = 'text-link no-underline visited:text-link hover:underline'

// ── Covers ────────────────────────────────────────────────────────────────────────────────────

const ACCENTS = [
  'var(--liro-chart-category1)',
  'var(--liro-chart-category2)',
  'var(--liro-chart-category3)',
  'var(--liro-chart-category4)',
  'var(--liro-chart-category5)',
]

/** A post's cover: shapes in the tokens' colours, decided by its number; decorative. */
export function CoverArt({ variant }: { variant: number }) {
  const accent = ACCENTS[variant % ACCENTS.length] ?? 'var(--liro-chart-main)'
  const shift = (variant * 23) % 60
  const rows = [0, 1, 2].map((row) => 24 + row * 14 + (variant % 3) * 2)
  return (
    <svg
      viewBox="0 0 160 90"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
      className="block size-full"
    >
      <rect width="160" height="90" fill="var(--liro-surface-sunken)" />
      <circle cx={30 + shift} cy="74" r="44" fill="var(--liro-brand-subtle)" />
      <rect x={92 - shift / 3} y="16" width="46" height="46" rx="6" fill={accent} opacity="0.85" />
      {rows.map((y, index) => (
        <rect
          key={y}
          x="16"
          y={y}
          width={44 - index * 10}
          height="4"
          rx="2"
          fill="var(--liro-border-strong)"
        />
      ))}
    </svg>
  )
}

// ── The public blog's frame ──────────────────────────────────────────────────────────────────

function BlogFrame({
  phone,
  banners,
  children,
}: {
  phone: boolean
  banners?: ReactNode
  children: ReactNode
}) {
  return (
    <Tenant today={AC_TODAY}>
      <PortalShell
        layout={phone ? 'phone' : 'desktop'}
        brand={{ brandName: 'Liro', productName: 'Blog', href: `#${AC_ROUTES.home}` }}
        {...(banners === undefined ? {} : { banners })}
        footer="Liro · Novi Sad · blog@liro.example.com · Illustrative data"
      >
        {children}
        <Toaster layout={phone ? 'phone' : 'desktop'} />
      </PortalShell>
    </Tenant>
  )
}

function summary(post: Post): ArticleSummary {
  return {
    id: post.id,
    title: post.title,
    href: `#${AC_ROUTES.post(post.slug)}`,
    excerpt: post.excerpt,
    category: categoryLabel(post.category),
    author: AUTHORS[post.author]?.name ?? '',
    date: post.date,
    readingTime: post.readingTime,
    cover: <CoverArt variant={post.cover} />,
  }
}

/** The query typed last, kept above the screens as the application keeps it in the address. */
function useSearchQuery() {
  return useExampleState('ac-query', () => '')
}

/** The search box: the query goes to the search page. */
function BlogSearch({ query = '' }: { query?: string }) {
  const navigate = useContext(Navigate)
  const [, setQuery] = useSearchQuery()
  const [text, setText] = useState(query)
  return (
    <form
      role="search"
      aria-label="Search the blog"
      className="flex min-w-0 items-end gap-2"
      onSubmit={(event) => {
        event.preventDefault()
        if (text.trim() === '') return
        setQuery(text.trim())
        navigate(AC_ROUTES.search)
      }}
    >
      <TextField
        label="Search the blog"
        hideLabel
        type="search"
        placeholder="Search articles"
        value={text}
        onChange={setText}
        className="min-w-0 flex-1 sm:max-w-[26rem] sm:flex-none"
      />
      <Button family="neutral" icon={Search} type="submit" label="Search" />
    </form>
  )
}

/** The categories as links, the current one the neutral selection. */
function CategoryNav({ current }: { current?: string }) {
  const { linkComponent: Link } = useLiro()
  const items = [{ id: '', label: 'All' }, ...CATEGORIES]
  return (
    <nav aria-label="Categories">
      <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
        {items.map((each) => {
          const selected = (current ?? '') === each.id
          return (
            <li key={each.id} className="flex">
              <Link
                href={`#${each.id === '' ? AC_ROUTES.home : AC_ROUTES.category(each.id)}`}
                {...(selected ? { 'aria-current': 'page' } : {})}
                className={`bidi-content inline-flex min-h-8 items-center rounded-md border border-solid px-3 text-sm no-underline ${selected ? 'border-selected bg-surface-selected font-medium text-primary visited:text-primary' : 'border-default bg-surface-raised text-primary visited:text-primary hover:bg-surface-hover'}`}
              >
                {each.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

function TagCloud() {
  const { linkComponent: Link } = useLiro()
  return (
    <section className="flex flex-col gap-2" aria-labelledby="blog-tags">
      <h2 id="blog-tags" className="bidi-content m-0 text-sm font-semibold text-primary">
        Popular tags
      </h2>
      <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
        {TAGS.map((tag) => (
          <li key={tag.id} className="flex">
            <Link
              href={`#${AC_ROUTES.tag(tag.id)}`}
              className="bidi-content inline-flex min-h-6 items-center rounded-sm border border-solid border-default bg-surface-raised px-2 text-xs text-primary no-underline visited:text-primary hover:bg-surface-hover"
            >
              {tag.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

function BlogPage({ phone, children }: { phone: boolean; children: ReactNode }) {
  return (
    <div
      className={`mx-auto box-border flex w-full max-w-6xl min-w-0 flex-col ${phone ? 'gap-6 p-4' : 'gap-8 px-6 py-10'}`}
    >
      {children}
    </div>
  )
}

function Newsletter({ phone }: { phone: boolean }) {
  return (
    <NewsletterSignup
      layout={phone ? 'phone' : 'desktop'}
      title={NEWSLETTER.title}
      description={NEWSLETTER.description}
      consent={NEWSLETTER.consent}
      onSubscribe={() => undefined}
    />
  )
}

// ── 1. The list ──────────────────────────────────────────────────────────────────────────────

export function BlogHome({
  phone,
  category,
  tag,
}: {
  phone: boolean
  category?: string
  tag?: string
}) {
  const { linkComponent: Link } = useLiro()
  const posts = PUBLISHED.filter(
    (each) =>
      (category === undefined || each.category === category) &&
      (tag === undefined || each.tags.includes(tag)),
  )
  const title =
    category !== undefined
      ? categoryLabel(category)
      : tag !== undefined
        ? tagLabel(tag)
        : 'Liro blog'
  return (
    <BlogFrame phone={phone}>
      <BlogPage phone={phone}>
        <header className="flex flex-col gap-2">
          <h1 className={`bidi-content m-0 text-primary ${phone ? 'text-h2' : 'text-h1'}`}>
            {title}
          </h1>
          <p className="bidi-content m-0 text-md text-secondary">
            {tag !== undefined ? (
              <>
                {`Articles tagged “${tagLabel(tag)}”. `}
                <Link href={`#${AC_ROUTES.home}`} className={LINK}>
                  All articles
                </Link>
              </>
            ) : (
              'E-invoicing, accounting, payroll and people for small companies and their accountants.'
            )}
          </p>
        </header>
        <div className="flex flex-col gap-4">
          <BlogSearch />
          <CategoryNav {...(category === undefined ? {} : { current: category })} />
        </div>
        <ArticleList
          label={category === undefined && tag === undefined ? 'Latest articles' : title}
          layout={phone ? 'phone' : 'desktop'}
          featured={category === undefined && tag === undefined}
          articles={posts.map(summary)}
        />
        <TagCloud />
        <Newsletter phone={phone} />
      </BlogPage>
    </BlogFrame>
  )
}

// ── 2. The search ────────────────────────────────────────────────────────────────────────────

export function BlogSearchPage({ phone, query: fixed }: { phone: boolean; query?: string }) {
  const { format } = useLiro()
  const navigate = useContext(Navigate)
  const [typed] = useSearchQuery()
  const query = fixed ?? typed
  const found = searchPosts(query)
  const results: SearchResult[] = found.map((post) => {
    const titleRanges = matchRanges(post.title, query)
    return {
      id: post.id,
      title: titleRanges.length > 0 ? snippetFromRanges(post.title, titleRanges) : post.title,
      href: `#${AC_ROUTES.post(post.slug)}`,
      meta: `${categoryLabel(post.category)} · ${format.date(post.date)}`,
      snippet: snippetFromRanges(post.excerpt, matchRanges(post.excerpt, query)),
    }
  })
  return (
    <BlogFrame phone={phone}>
      <BlogPage phone={phone}>
        <header className="flex flex-col gap-4">
          <h1 className={`bidi-content m-0 text-primary ${phone ? 'text-h2' : 'text-h1'}`}>
            Search the blog
          </h1>
          <BlogSearch key={query} query={query} />
        </header>
        <SearchResultList
          label="Search results"
          results={results}
          summary={`${format.number(String(results.length))} ${results.length === 1 ? 'article' : 'articles'} for “${query}”`}
          empty={
            <EmptyState
              variant="no-results"
              title={`Nothing found for “${query}”`}
              description="Try other words, or browse the categories."
              action={{
                label: 'All articles',
                onClick: () => {
                  navigate(AC_ROUTES.home)
                },
              }}
            />
          }
        />
        <Newsletter phone={phone} />
      </BlogPage>
    </BlogFrame>
  )
}

// ── 3. The article ───────────────────────────────────────────────────────────────────────────

function PostReading({ post, phone }: { post: Post; phone: boolean }) {
  const author = AUTHORS[post.author]
  const headings = richTextHeadings(post.body, 'post')
  const related = post.related
    .map((id) => findPost(id))
    .filter((each): each is Post => each?.state === 'Published')
  const url = `${BLOG_URL}/${post.slug}`
  return (
    <ArticlePage
      layout={phone ? 'phone' : 'desktop'}
      title={post.title}
      back={{ label: 'Blog', href: `#${AC_ROUTES.home}` }}
      category={{
        label: categoryLabel(post.category),
        href: `#${AC_ROUTES.category(post.category)}`,
      }}
      lede={post.excerpt}
      {...(author === undefined ? {} : { author: { name: author.name, detail: author.detail } })}
      date={post.date}
      {...(post.updated === undefined ? {} : { updated: post.updated })}
      readingTime={post.readingTime}
      cover={<CoverArt variant={post.cover} />}
      {...(headings.length >= 4
        ? {
            contents: (
              <PageContents
                entries={headings}
                layout={phone ? 'phone' : 'desktop'}
                sticky={!phone}
              />
            ),
          }
        : {})}
      tags={post.tags.map((id) => ({
        key: id,
        label: tagLabel(id),
        href: `#${AC_ROUTES.tag(id)}`,
      }))}
      share={
        <ShareLinks
          url={url}
          targets={[
            {
              key: 'mail',
              label: 'E-mail',
              icon: Mail,
              href: `mailto:?subject=${encodeURIComponent(post.title)}&body=${encodeURIComponent(url)}`,
            },
            {
              key: 'linkedin',
              label: 'LinkedIn',
              href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
            },
          ]}
        />
      }
      newsletter={<Newsletter phone={phone} />}
      {...(related.length > 0
        ? {
            related: (
              <ArticleList
                label="Related articles"
                headingLevel={3}
                layout={phone ? 'phone' : 'desktop'}
                articles={related.map(summary)}
              />
            ),
          }
        : {})}
    >
      <RichText value={post.body} headingIds="post" className="flex flex-col gap-4 text-md" />
    </ArticlePage>
  )
}

export function BlogPost({ phone, slug }: { phone: boolean; slug: string }) {
  const post = findPost(slug)
  return (
    <BlogFrame phone={phone}>
      {post?.state !== 'Published' ? (
        <BlogPage phone={phone}>
          <EmptyState title="This article was moved or removed" />
        </BlogPage>
      ) : (
        <PostReading post={post} phone={phone} />
      )}
    </BlogFrame>
  )
}

// ── 4. Authoring ─────────────────────────────────────────────────────────────────────────────

const ACCOUNT = {
  name: EDITOR.name,
  email: EDITOR.email,
  companies: [{ id: 'liro', name: 'Liro', description: 'Website and blog' }],
  links: [
    { label: 'Blog posts', path: AC_ROUTES.posts },
    { label: 'The public blog', path: AC_ROUTES.home },
  ],
}

function AuthoringShell({
  phone,
  crumbs,
  children,
}: {
  phone: boolean
  crumbs: { label: string; href?: string }[]
  children: ReactNode
}) {
  return (
    <Tenant today={AC_TODAY}>
      <Shell
        phone={phone}
        account={ACCOUNT}
        company="liro"
        crumbs={[{ label: 'Website' }, ...crumbs]}
      >
        {children}
        <Toaster layout={phone ? 'phone' : 'desktop'} />
      </Shell>
    </Tenant>
  )
}

/** The posts as the application keeps them: changed in the editor, seen in the list. */
function usePosts() {
  return useExampleState<Post[]>('ac-posts', () => [...POSTS])
}

function PostTitle({ post }: { post: Post }) {
  const { linkComponent: Link } = useLiro()
  return (
    <Link href={`#${AC_ROUTES.edit(post.id)}`} className={`bidi-content font-medium ${LINK}`}>
      {post.title}
    </Link>
  )
}

function PostWhen({ post }: { post: Post }) {
  const { format } = useLiro()
  const text =
    post.state === 'Scheduled'
      ? `${format.date(post.date)} ${post.time ?? ''}`.trim()
      : post.state === 'Published'
        ? format.date(post.date)
        : '—'
  return <bdi className="tabular-nums">{text}</bdi>
}

const POST_COLUMNS: DataTableColumn<Post>[] = [
  { id: 'title', header: 'Title', cell: (post) => <PostTitle post={post} /> },
  { id: 'category', header: 'Category', cell: (post) => categoryLabel(post.category) },
  { id: 'author', header: 'Author', cell: (post) => AUTHORS[post.author]?.name ?? '' },
  { id: 'when', header: 'Goes out', numeric: true, cell: (post) => <PostWhen post={post} /> },
  { id: 'state', header: 'State', cell: (post) => statusBadge(post.state) },
]

export function BlogPosts({ phone }: { phone: boolean }) {
  const navigate = useContext(Navigate)
  const [posts] = usePosts()
  const [view, setView] = useState('all')
  const count = (state: Post['state']) => posts.filter((each) => each.state === state).length
  const views = [
    { id: 'all', label: 'All', count: posts.length },
    { id: 'Draft', label: 'Drafts', count: count('Draft') },
    { id: 'Scheduled', label: 'Scheduled', count: count('Scheduled') },
    { id: 'Published', label: 'Published', count: count('Published') },
  ]
  const rows = [...(view === 'all' ? posts : posts.filter((each) => each.state === view))].sort(
    (a, b) => b.date.localeCompare(a.date),
  )
  return (
    <AuthoringShell phone={phone} crumbs={[{ label: 'Blog posts' }]}>
      <Frame phone={phone}>
        <ListPage
          layout={phone ? 'phone' : 'desktop'}
          title="Blog posts"
          titleHidden={false}
          actions={
            <Button
              intent="create"
              label="New post"
              onClick={() => {
                navigate(AC_ROUTES.edit('p8'))
              }}
            />
          }
          views={views}
          view={view}
          onViewChange={setView}
        >
          <DataTable
            label="Blog posts"
            layout={phone ? 'cards' : 'table'}
            inCard
            columns={POST_COLUMNS}
            rows={rows}
            getRowId={(post) => post.id}
            getRowLabel={(post) => post.title}
            count={rows.length}
            onRowClick={(post) => {
              navigate(AC_ROUTES.edit(post.id))
            }}
            mobile={{
              title: (post) => post.title,
              subtitle: (post) => categoryLabel(post.category),
              badge: (post) => statusBadge(post.state),
              details: ['author', 'when'],
            }}
          />
        </ListPage>
      </Frame>
    </AuthoringShell>
  )
}

interface Errors {
  title?: string
  slug?: string
  seoDescription?: string
  body?: string
}

/** What a post needs before it goes out, in the application's words. */
function publishErrors(post: Post): Errors {
  return {
    ...(post.title.trim() === '' ? { title: 'Write a title.' } : {}),
    ...(/^[a-z0-9-]+$/.test(post.slug)
      ? {}
      : { slug: 'Use lowercase letters, digits and hyphens.' }),
    ...(post.seoDescription.trim() === ''
      ? { seoDescription: 'Write a description for search engines.' }
      : {}),
    ...(isRichTextEmpty(post.body) ? { body: 'Write the article.' } : {}),
  }
}

export function PostEditor({ phone, id, open }: { phone: boolean; id: string; open?: 'schedule' }) {
  const { format } = useLiro()
  const navigate = useContext(Navigate)
  const [posts, setPosts] = usePosts()
  const saved = posts.find((each) => each.id === id)
  const [draft, setDraft] = useState<Post | undefined>(saved)
  const [dirty, setDirty] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  const [scheduling, setScheduling] = useState(open === 'schedule')
  const [publishing, setPublishing] = useState(false)
  const [when, setWhen] = useState({ date: '2026-10-28', time: '08:00' })
  if (draft === undefined || saved === undefined) {
    return (
      <AuthoringShell phone={phone} crumbs={[{ label: 'Blog posts', href: `#${AC_ROUTES.posts}` }]}>
        <EmptyState title="This post does not exist" />
      </AuthoringShell>
    )
  }
  const set = (change: Partial<Post>) => {
    setDraft({ ...draft, ...change })
    setDirty(true)
  }
  const store = (post: Post) => {
    setPosts(posts.map((each) => (each.id === post.id ? post : each)))
    setDraft(post)
    setDirty(false)
  }
  const ready = () => {
    const found = publishErrors(draft)
    setErrors(found)
    return Object.keys(found).length === 0
  }
  const actions: ActionItem[] = [
    {
      key: 'preview',
      label: 'Preview',
      intent: 'preview',
      onClick: () => {
        store(draft)
        navigate(AC_ROUTES.preview(draft.id))
      },
    },
    ...(draft.state === 'Published'
      ? [
          {
            key: 'unpublish',
            label: 'Unpublish',
            family: 'neutral' as const,
            icon: Undo2,
            onClick: () => {
              store({ ...draft, state: 'Draft' })
              notice.success('The post is a draft again; it is no longer on the blog')
            },
          },
          {
            key: 'save',
            label: 'Save changes',
            intent: 'save' as const,
            emphasis: 'primary' as const,
            onClick: () => {
              if (!ready()) return
              store(draft)
              notice.success('Changes published')
            },
          },
        ]
      : [
          {
            key: 'save',
            label: draft.state === 'Scheduled' ? 'Save' : 'Save draft',
            intent: 'save' as const,
            emphasis: 'secondary' as const,
            onClick: () => {
              store(draft)
              notice.success('Saved')
            },
          },
          draft.state === 'Scheduled'
            ? {
                key: 'unschedule',
                label: 'Unschedule',
                family: 'neutral' as const,
                icon: Undo2,
                onClick: () => {
                  store({ ...draft, state: 'Draft' })
                  notice.success('The post is a draft again')
                },
              }
            : {
                key: 'schedule',
                label: 'Schedule…',
                family: 'neutral' as const,
                icon: CalendarClock,
                onClick: () => {
                  if (ready()) setScheduling(true)
                },
              },
          {
            key: 'publish',
            label: draft.state === 'Scheduled' ? 'Publish now' : 'Publish',
            family: 'primary' as const,
            icon: Globe,
            emphasis: 'primary' as const,
            onClick: () => {
              if (ready()) setPublishing(true)
            },
          },
        ]),
  ]
  const subtitle =
    saved.state === 'Published'
      ? `Published ${format.date(saved.date)}`
      : saved.state === 'Scheduled'
        ? `Goes out ${format.date(saved.date)} at ${saved.time ?? ''}, Belgrade time`
        : 'Not on the blog'
  const columns = phone ? 1 : 2
  const url = `${BLOG_URL}/${draft.slug}`
  return (
    <AuthoringShell
      phone={phone}
      crumbs={[{ label: 'Blog posts', href: `#${AC_ROUTES.posts}` }, { label: saved.title }]}
    >
      <RecordFormPage
        layout={phone ? 'phone' : 'desktop'}
        title={saved.title}
        back={{ label: 'Blog posts', href: `#${AC_ROUTES.posts}` }}
        status={statusBadge(saved.state)}
        subtitle={subtitle}
        dirty={dirty}
        actions={<ActionGroup actions={actions} />}
      >
        <div className="flex flex-col gap-4">
          <FormSection title="Article" columns={1}>
            <TextField
              label="Title"
              required
              value={draft.title}
              onChange={(title) => {
                set({ title })
              }}
              {...(errors.title === undefined ? {} : { error: errors.title })}
            />
            <TextAreaField
              label="Excerpt"
              description="One or two sentences under the title and on the cards."
              rows={2}
              value={draft.excerpt}
              onChange={(excerpt) => {
                set({ excerpt })
              }}
            />
            <RichTextField
              label="Text"
              required
              defaultValue={draft.body}
              minRows={10}
              onChange={(value) => {
                set({ body: value.json })
              }}
              {...(errors.body === undefined ? {} : { error: errors.body })}
            />
          </FormSection>
          <FormSection title="Cover" columns={columns}>
            <div className="flex min-w-0 flex-col gap-2">
              <div className="aspect-video w-full max-w-md overflow-hidden rounded-lg bg-surface-sunken">
                <CoverArt variant={draft.cover} />
              </div>
              <SelectField
                label="Drawing"
                options={[0, 1, 2, 3, 4, 5, 6, 7].map((n) => ({
                  value: String(n),
                  label: `Drawing ${String(n + 1)}`,
                }))}
                value={String(draft.cover)}
                onChange={(value) => {
                  set({ cover: Number(value) })
                }}
              />
            </div>
            <FileDropzone
              label="Or upload an image"
              description="Shown at 16:9; a drawing stays until the image is uploaded."
              accept={['image/png', 'image/jpeg', 'image/webp']}
              acceptText="PNG, JPG or WebP"
              maxSize={2 * 1024 * 1024}
              maxSizeText="2 MB"
              multiple={false}
              layout={phone ? 'phone' : 'desktop'}
              onFiles={(files) => {
                notice.info(`${files[0]?.name ?? 'The image'} will be the cover once uploaded`)
              }}
            />
          </FormSection>
          <FormSection title="Where it appears" columns={columns}>
            <TextField
              label="Address"
              required
              direction="ltr"
              description={url}
              value={draft.slug}
              onChange={(slug) => {
                set({ slug })
              }}
              {...(errors.slug === undefined ? {} : { error: errors.slug })}
            />
            <SelectField
              label="Category"
              options={CATEGORIES.map((each) => ({ value: each.id, label: each.label }))}
              value={draft.category}
              onChange={(category) => {
                set({ category })
              }}
            />
            <MultiSelectField
              label="Tags"
              options={TAGS.map((each) => ({ value: each.id, label: each.label }))}
              value={draft.tags}
              onChange={(tags) => {
                set({ tags })
              }}
            />
            <SelectField
              label="Author"
              options={Object.values(AUTHORS).map((each) => ({ value: each.id, label: each.name }))}
              value={draft.author}
              onChange={(author) => {
                set({ author })
              }}
            />
          </FormSection>
          <FormSection
            title="Search engines"
            description="How the article is named and described in search results."
            columns={1}
          >
            <TextField
              label="Title for search engines"
              description={`${format.number(String(draft.seoTitle.length))} of 60 characters`}
              value={draft.seoTitle}
              onChange={(seoTitle) => {
                set({ seoTitle })
              }}
            />
            <TextAreaField
              label="Description for search engines"
              required
              rows={2}
              description={`${format.number(String(draft.seoDescription.length))} of 160 characters`}
              value={draft.seoDescription}
              onChange={(seoDescription) => {
                set({ seoDescription })
              }}
              {...(errors.seoDescription === undefined ? {} : { error: errors.seoDescription })}
            />
            <FormFullWidth>
              <div className="flex flex-col gap-2">
                <p className="bidi-content m-0 text-xs font-medium text-secondary">
                  How a search result may show it
                </p>
                <SearchResultList
                  label="Search result preview"
                  headingLevel={3}
                  results={[
                    {
                      id: draft.id,
                      title: draft.seoTitle === '' ? draft.title : draft.seoTitle,
                      href: `#${AC_ROUTES.preview(draft.id)}`,
                      meta: url,
                      snippet: [draft.seoDescription === '' ? draft.excerpt : draft.seoDescription],
                    },
                  ]}
                />
              </div>
            </FormFullWidth>
          </FormSection>
        </div>
      </RecordFormPage>
      <Dialog
        title="Schedule"
        subject={draft.title}
        open={scheduling}
        onOpenChange={setScheduling}
        actions={
          <>
            <Button
              intent="cancel"
              label="Cancel"
              onClick={() => {
                setScheduling(false)
              }}
            />
            <Button
              family="primary"
              icon={CalendarClock}
              emphasis="primary"
              label="Schedule"
              onClick={() => {
                store({ ...draft, state: 'Scheduled', date: when.date, time: when.time })
                setScheduling(false)
                notice.success(`Scheduled for ${format.date(when.date)} at ${when.time}`)
              }}
            />
          </>
        }
      >
        <DateField
          label="Publish on"
          required
          value={when.date}
          onChange={(date) => {
            if (date !== null) setWhen({ ...when, date })
          }}
        />
        <SelectField
          label="Time"
          options={TIME_OPTIONS}
          value={when.time}
          onChange={(time) => {
            setWhen({ ...when, time })
          }}
        />
        <p className="bidi-content m-0 text-sm text-secondary">
          Belgrade time. It goes out by itself, with the next newsletter; you can change or cancel
          it until then.
        </p>
      </Dialog>
      <ConfirmDialog
        open={publishing}
        onOpenChange={setPublishing}
        family="primary"
        actionIcon={Globe}
        title="Publish post"
        subject={draft.title}
        message="It appears on the blog now, for everyone, and in the next newsletter."
        confirmLabel="Publish"
        onConfirm={() => {
          store({ ...draft, state: 'Published', date: AC_TODAY })
          notice.success('Published on the blog')
        }}
      />
    </AuthoringShell>
  )
}

/** A draft as the reader will see it, under a "Preview" banner. */
export function PostPreview({ phone, id }: { phone: boolean; id: string }) {
  const navigate = useContext(Navigate)
  const [posts] = usePosts()
  const post = posts.find((each) => each.id === id)
  if (post === undefined) return <BlogPost phone={phone} slug={id} />
  return (
    <BlogFrame
      phone={phone}
      banners={
        <Banner
          tone="info"
          icon={Eye}
          role="status"
          title="Preview"
          actions={
            <Button
              family="neutral"
              icon={PenLine}
              label="Back to editing"
              onClick={() => {
                navigate(AC_ROUTES.edit(post.id))
              }}
            />
          }
        >
          {post.state === 'Published'
            ? 'This is how the article looks with your changes.'
            : 'Only you see this page. The article is not on the blog yet.'}
        </Banner>
      }
    >
      <PostReading post={post} phone={phone} />
    </BlogFrame>
  )
}

// ── Routes ────────────────────────────────────────────────────────────────────────────────────

export const GROUP_AC_ROUTES: ExampleRoute[] = [
  { path: AC_ROUTES.home, render: (phone) => <BlogHome phone={phone} /> },
  ...CATEGORIES.map((each) => ({
    path: AC_ROUTES.category(each.id),
    render: (phone: boolean) => <BlogHome phone={phone} category={each.id} />,
  })),
  ...TAGS.map((each) => ({
    path: AC_ROUTES.tag(each.id),
    render: (phone: boolean) => <BlogHome phone={phone} tag={each.id} />,
  })),
  ...POSTS.map((post) => ({
    path: AC_ROUTES.post(post.slug),
    render: (phone: boolean) => <BlogPost phone={phone} slug={post.slug} />,
  })),
  { path: AC_ROUTES.search, render: (phone) => <BlogSearchPage phone={phone} /> },
  ...['rejected', 'fiscal printer'].map((query) => ({
    path: AC_ROUTES.searchFor(query),
    render: (phone: boolean) => <BlogSearchPage phone={phone} query={query} />,
  })),
  { path: AC_ROUTES.posts, render: (phone) => <BlogPosts phone={phone} /> },
  ...POSTS.map((post) => ({
    path: AC_ROUTES.edit(post.id),
    render: (phone: boolean) => <PostEditor phone={phone} id={post.id} />,
  })),
  {
    path: AC_ROUTES.schedule('p8'),
    render: (phone) => <PostEditor phone={phone} id="p8" open="schedule" />,
  },
  ...POSTS.map((post) => ({
    path: AC_ROUTES.preview(post.id),
    render: (phone: boolean) => <PostPreview phone={phone} id={post.id} />,
  })),
]
