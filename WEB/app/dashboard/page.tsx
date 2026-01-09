'use client'

import { useState, useEffect } from 'react'
import { 
  Brain, 
  Plus, 
  Home, 
  Search, 
  Settings, 
  ChevronDown,
  ChevronRight,
  Smile,
  Briefcase,
  Heart,
  Star,
  Zap,
  Coffee,
  Book,
  Music,
  Code,
  Palette,
  Camera,
  Rocket,
  MoreHorizontal,
  X,
  FolderPlus,
  MessageSquare,
  Folder,
  Bot
} from 'lucide-react'
import { Dialog } from '../components/Dialog'
import { ChatComponent } from '../components/Chat'

interface TOCItem {
  id: string
  title: string
  level: number
  pageIndex: number
  children?: TOCItem[]
}

interface NotePage {
  id: string
  title: string
  content: string
}

interface Note {
  id: string
  title: string
  tableOfContents: TOCItem[]
  pages: NotePage[]
  createdAt: string
  updatedAt: string
}

interface Space {
  id: string
  name: string
  icon: string
  subspaces?: Space[]
  parentId?: string
  notes?: Note[]
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  mode?: 'note-taking' | 'ask' | 'explore'
}

interface Chat {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: string
  updatedAt: string
  folderId?: string
}

interface ChatFolder {
  id: string
  name: string
  chats: Chat[]
}

const availableIcons = [
  { name: 'Smile', component: Smile },
  { name: 'Briefcase', component: Briefcase },
  { name: 'Heart', component: Heart },
  { name: 'Star', component: Star },
  { name: 'Zap', component: Zap },
  { name: 'Coffee', component: Coffee },
  { name: 'Book', component: Book },
  { name: 'Music', component: Music },
  { name: 'Code', component: Code },
  { name: 'Palette', component: Palette },
  { name: 'Camera', component: Camera },
  { name: 'Rocket', component: Rocket },
]

export default function DashboardPage() {
  const [spaces, setSpaces] = useState<Space[]>([
    { 
      id: '1', 
      name: 'AI Agents', 
      icon: 'Rocket',
      subspaces: [],
      notes: [
        {
          id: 'note-ai-1',
          title: 'Introduction to AI Agents',
          tableOfContents: [
            { 
              id: 'what-are-agents', 
              title: 'What are AI Agents?', 
              level: 1, 
              pageIndex: 0,
              children: [
                { id: 'key-characteristics', title: 'Key Characteristics', level: 2, pageIndex: 0 }
              ]
            },
            { 
              id: 'types-of-agents', 
              title: 'Types of AI Agents', 
              level: 1, 
              pageIndex: 1,
              children: [
                { id: 'simple-reflex', title: 'Simple Reflex Agents', level: 2, pageIndex: 1 },
                { id: 'model-based', title: 'Model-Based Reflex Agents', level: 2, pageIndex: 1 },
                { id: 'goal-based', title: 'Goal-Based Agents', level: 2, pageIndex: 1 },
                { id: 'utility-based', title: 'Utility-Based Agents', level: 2, pageIndex: 1 },
                { id: 'learning-agents', title: 'Learning Agents', level: 2, pageIndex: 1 }
              ]
            },
            { 
              id: 'agent-architectures', 
              title: 'Agent Architectures', 
              level: 1, 
              pageIndex: 2,
              children: [
                { id: 'react-arch', title: 'ReAct (Reasoning + Acting)', level: 2, pageIndex: 2 },
                { id: 'autogpt-arch', title: 'AutoGPT Architecture', level: 2, pageIndex: 2 },
                { id: 'langchain-arch', title: 'LangChain Agents', level: 2, pageIndex: 2 }
              ]
            },
            { 
              id: 'use-cases', 
              title: 'Real-World Use Cases', 
              level: 1, 
              pageIndex: 3,
              children: [
                { id: 'customer-support', title: 'Customer Support Agents', level: 2, pageIndex: 3 },
                { id: 'research-assistants', title: 'Research Assistants', level: 2, pageIndex: 3 },
                { id: 'code-generation', title: 'Code Generation & Debugging', level: 2, pageIndex: 3 },
                { id: 'data-analysis', title: 'Data Analysis Agents', level: 2, pageIndex: 3 }
              ]
            },
            { 
              id: 'best-practices', 
              title: 'Best Practices', 
              level: 1, 
              pageIndex: 4,
              children: [
                { id: 'goal-definition', title: 'Clear Goal Definition', level: 2, pageIndex: 4 },
                { id: 'error-handling', title: 'Robust Error Handling', level: 2, pageIndex: 4 },
                { id: 'monitoring', title: 'Monitoring and Logging', level: 2, pageIndex: 4 },
                { id: 'safety-constraints', title: 'Safety Constraints', level: 2, pageIndex: 4 },
                { id: 'testing', title: 'Testing Strategies', level: 2, pageIndex: 4 }
              ]
            }
          ],
          pages: [
            {
              id: 'page-1',
              title: 'What are AI Agents?',
              content: `<div class="prose max-w-none">
                <h2 id="what-are-agents">What are AI Agents?</h2>
                <p>AI agents are autonomous systems that can perceive their environment, make decisions, and take actions to achieve specific goals. Unlike traditional software, AI agents can adapt and learn from their experiences.</p>
                
                <h3 id="key-characteristics">Key Characteristics</h3>
                <ul>
                  <li><strong>Autonomy:</strong> Operate without direct human intervention</li>
                  <li><strong>Reactivity:</strong> Respond to changes in their environment</li>
                  <li><strong>Proactivity:</strong> Take initiative to achieve goals</li>
                  <li><strong>Social Ability:</strong> Interact with other agents or humans</li>
                </ul>
                
                <blockquote class="border-l-4 border-purple-500 pl-4 italic">
                  "An agent is anything that can perceive its environment through sensors and act upon that environment through actuators." - Russell & Norvig
                </blockquote>
              </div>`
            },
            {
              id: 'page-2',
              title: 'Types of AI Agents',
              content: `<div class="prose max-w-none">
                <h2 id="types-of-agents">Types of AI Agents</h2>
                
                <h3 id="simple-reflex">1. Simple Reflex Agents</h3>
                <p>These agents select actions based on the current percept, ignoring the history of percepts. They work well in fully observable environments.</p>
                
                <pre class="bg-gray-100 p-4 rounded-lg"><code>if temperature > 25°C:
    turn_on_ac()
else:
    turn_off_ac()</code></pre>
                
                <h3 id="model-based">2. Model-Based Reflex Agents</h3>
                <p>Maintain an internal state to track aspects of the world that are not visible in the current percept.</p>
                
                <h3 id="goal-based">3. Goal-Based Agents</h3>
                <p>Make decisions based on how well they help achieve specific goals. They consider future consequences of actions.</p>
                
                <h3 id="utility-based">4. Utility-Based Agents</h3>
                <p>Use a utility function to measure how desirable different states are, allowing them to make trade-offs.</p>
                
                <h3 id="learning-agents">5. Learning Agents</h3>
                <p>Can improve their performance over time through experience and learning algorithms.</p>
              </div>`
            },
            {
              id: 'page-3',
              title: 'Agent Architectures',
              content: `<div class="prose max-w-none">
                <h2 id="agent-architectures">Agent Architectures</h2>
                
                <h3 id="react-arch">ReAct (Reasoning + Acting)</h3>
                <p>Combines reasoning and acting in an interleaved manner. The agent thinks about what to do and then acts, using the results to inform further reasoning.</p>
                
                <div class="bg-blue-50 p-4 rounded-lg my-4">
                  <strong>ReAct Loop:</strong>
                  <ol>
                    <li>Thought: Analyze the current situation</li>
                    <li>Action: Take an action based on reasoning</li>
                    <li>Observation: Observe the result</li>
                    <li>Repeat until goal is achieved</li>
                  </ol>
                </div>
                
                <h3 id="autogpt-arch">AutoGPT Architecture</h3>
                <p>Autonomous agents that can break down complex tasks into subtasks and execute them independently:</p>
                <ul>
                  <li>Memory management (short-term and long-term)</li>
                  <li>Task decomposition</li>
                  <li>Tool usage and API integration</li>
                  <li>Self-reflection and error correction</li>
                </ul>
                
                <h3 id="langchain-arch">LangChain Agents</h3>
                <p>Framework for building agents with:</p>
                <ul>
                  <li>Tool selection and usage</li>
                  <li>Memory systems</li>
                  <li>Chain-of-thought reasoning</li>
                  <li>Multi-step planning</li>
                </ul>
              </div>`
            },
            {
              id: 'page-4',
              title: 'Real-World Use Cases',
              content: `<div class="prose max-w-none">
                <h2 id="use-cases">Real-World Use Cases</h2>
                
                <h3 id="customer-support">Customer Support Agents</h3>
                <p>Autonomous agents that can handle customer inquiries, access knowledge bases, escalate to humans when needed, and learn from interactions.</p>
                
                <h3 id="research-assistants">Research Assistants</h3>
                <p>Agents that can search multiple sources, synthesize information, fact-check claims, and generate comprehensive reports.</p>
                
                <h3 id="code-generation">Code Generation & Debugging</h3>
                <p>Agents that understand requirements, write code, run tests, debug issues, and iterate until the solution works.</p>
                
                <div class="bg-green-50 p-4 rounded-lg my-4">
                  <h4>Example: Personal Assistant Agent</h4>
                  <pre class="bg-white p-3 rounded mt-2"><code>Agent Capabilities:
- Schedule management
- Email filtering and responses
- Task prioritization
- Meeting preparation
- Information retrieval
- Proactive reminders</code></pre>
                </div>
                
                <h3 id="data-analysis">Data Analysis Agents</h3>
                <p>Agents that can explore datasets, identify patterns, generate visualizations, and provide insights automatically.</p>
              </div>`
            },
            {
              id: 'page-5',
              title: 'Best Practices',
              content: `<div class="prose max-w-none">
                <h2 id="best-practices">Best Practices</h2>
                
                <h3 id="goal-definition">1. Clear Goal Definition</h3>
                <p>Define specific, measurable goals for your agent. Ambiguous goals lead to unpredictable behavior.</p>
                
                <h3 id="error-handling">2. Robust Error Handling</h3>
                <ul>
                  <li>Implement fallback strategies</li>
                  <li>Add retry logic with exponential backoff</li>
                  <li>Include human-in-the-loop for critical decisions</li>
                </ul>
                
                <h3 id="monitoring">3. Monitoring and Logging</h3>
                <pre class="bg-gray-100 p-4 rounded-lg"><code>// Log agent decisions
logger.info({
  thought: agent.current_thought,
  action: agent.selected_action,
  reasoning: agent.reasoning,
  timestamp: Date.now()
})</code></pre>
                
                <h3 id="safety-constraints">4. Safety Constraints</h3>
                <p>Implement guardrails to prevent harmful actions:</p>
                <ul>
                  <li>Cost limits on API calls</li>
                  <li>Rate limiting</li>
                  <li>Action approval workflows</li>
                  <li>Restricted tool access</li>
                </ul>
                
                <h3 id="testing">5. Testing Strategies</h3>
                <ul>
                  <li>Unit tests for individual components</li>
                  <li>Integration tests for tool interactions</li>
                  <li>Simulation environments for complex scenarios</li>
                  <li>A/B testing for agent behavior</li>
                </ul>
                
                <div class="bg-yellow-50 p-4 rounded-lg my-4">
                  <strong>⚠️ Important:</strong> Always start with simple agents and gradually increase complexity. Monitor behavior closely in production.
                </div>
              </div>`
            }
          ],
          createdAt: '2025-11-20',
          updatedAt: '2025-11-25'
        }
      ]
    },
    { 
      id: '2', 
      name: 'Next.js', 
      icon: 'Code',
      subspaces: [],
      notes: [
        {
          id: 'note-nextjs-1',
          title: 'Next.js 14 Complete Guide',
          tableOfContents: [
            { 
              id: 'app-router', 
              title: 'App Router Architecture', 
              level: 1, 
              pageIndex: 0,
              children: [
                { id: 'directory-structure', title: 'Directory Structure', level: 2, pageIndex: 0 },
                { id: 'key-concepts', title: 'Key Concepts', level: 2, pageIndex: 0 }
              ]
            },
            { 
              id: 'server-components', 
              title: 'Server Components', 
              level: 1, 
              pageIndex: 1,
              children: [
                { id: 'server-vs-client', title: 'Server vs Client Components', level: 2, pageIndex: 1 },
                { id: 'server-example', title: 'Example: Server Component', level: 2, pageIndex: 1 },
                { id: 'when-use-client', title: 'When to use "use client"', level: 2, pageIndex: 1 }
              ]
            },
            { 
              id: 'data-fetching', 
              title: 'Data Fetching Strategies', 
              level: 1, 
              pageIndex: 2,
              children: [
                { id: 'ssr', title: 'Server-Side Rendering (SSR)', level: 2, pageIndex: 2 },
                { id: 'ssg', title: 'Static Site Generation (SSG)', level: 2, pageIndex: 2 },
                { id: 'isr', title: 'Incremental Static Regeneration (ISR)', level: 2, pageIndex: 2 },
                { id: 'parallel-fetching', title: 'Parallel Data Fetching', level: 2, pageIndex: 2 }
              ]
            },
            { 
              id: 'routing', 
              title: 'Advanced Routing', 
              level: 1, 
              pageIndex: 3,
              children: [
                { id: 'dynamic-routes', title: 'Dynamic Routes', level: 2, pageIndex: 3 },
                { id: 'route-groups', title: 'Route Groups', level: 2, pageIndex: 3 },
                { id: 'parallel-routes', title: 'Parallel Routes', level: 2, pageIndex: 3 },
                { id: 'intercepting-routes', title: 'Intercepting Routes', level: 2, pageIndex: 3 }
              ]
            },
            { 
              id: 'optimization', 
              title: 'Performance Optimization', 
              level: 1, 
              pageIndex: 4,
              children: [
                { id: 'image-optimization', title: 'Image Optimization', level: 2, pageIndex: 4 },
                { id: 'font-optimization', title: 'Font Optimization', level: 2, pageIndex: 4 },
                { id: 'code-splitting', title: 'Code Splitting', level: 2, pageIndex: 4 },
                { id: 'metadata-seo', title: 'Metadata for SEO', level: 2, pageIndex: 4 }
              ]
            }
          ],
          pages: [
            {
              id: 'nextjs-page-1',
              title: 'App Router Architecture',
              content: `<div class="prose max-w-none">
                <h2 id="app-router">App Router Architecture</h2>
                <p>Next.js 14 introduces the App Router, a new paradigm for building React applications with enhanced capabilities for routing, layouts, and data fetching.</p>
                
                <h3 id="directory-structure">Directory Structure</h3>
                <pre class="bg-gray-100 p-4 rounded-lg"><code>app/
├── layout.tsx          # Root layout
├── page.tsx           # Home page
├── loading.tsx        # Loading UI
├── error.tsx          # Error UI
├── not-found.tsx      # 404 page
└── dashboard/
    ├── layout.tsx     # Dashboard layout
    ├── page.tsx       # Dashboard page
    └── [id]/
        └── page.tsx   # Dynamic route</code></pre>
        
                <h3 id="key-concepts">Key Concepts</h3>
                <ul>
                  <li><strong>Layouts:</strong> Shared UI that persists across routes</li>
                  <li><strong>Pages:</strong> Unique UI for each route</li>
                  <li><strong>Templates:</strong> Re-renders on navigation (unlike layouts)</li>
                  <li><strong>Loading States:</strong> Automatic loading UI with Suspense</li>
                </ul>
                
                <div class="bg-blue-50 p-4 rounded-lg my-4">
                  <strong>💡 Pro Tip:</strong> Use layouts to wrap multiple pages with shared UI like navigation bars, sidebars, and footers.
                </div>
              </div>`
            },
            {
              id: 'nextjs-page-2',
              title: 'Server Components',
              content: `<div class="prose max-w-none">
                <h2 id="server-components">Server Components</h2>
                <p>React Server Components (RSC) are a game-changer in Next.js 14. They run on the server and can directly access backend resources.</p>
                
                <h3 id="server-vs-client">Server vs Client Components</h3>
                <table class="min-w-full border-collapse border border-gray-300 my-4">
                  <thead class="bg-gray-100">
                    <tr>
                      <th class="border border-gray-300 px-4 py-2">Feature</th>
                      <th class="border border-gray-300 px-4 py-2">Server Components</th>
                      <th class="border border-gray-300 px-4 py-2">Client Components</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td class="border border-gray-300 px-4 py-2">Data Fetching</td>
                      <td class="border border-gray-300 px-4 py-2">✅ Direct DB access</td>
                      <td class="border border-gray-300 px-4 py-2">❌ API only</td>
                    </tr>
                    <tr>
                      <td class="border border-gray-300 px-4 py-2">Bundle Size</td>
                      <td class="border border-gray-300 px-4 py-2">✅ Zero JS sent</td>
                      <td class="border border-gray-300 px-4 py-2">❌ Sent to client</td>
                    </tr>
                    <tr>
                      <td class="border border-gray-300 px-4 py-2">Interactivity</td>
                      <td class="border border-gray-300 px-4 py-2">❌ No hooks/events</td>
                      <td class="border border-gray-300 px-4 py-2">✅ Full React features</td>
                    </tr>
                  </tbody>
                </table>
                
                <h3 id="server-example">Example: Server Component</h3>
                <pre class="bg-gray-100 p-4 rounded-lg"><code>// app/posts/page.tsx (Server Component by default)
async function getPosts() {
  const res = await fetch('https://api.example.com/posts')
  return res.json()
}

export default async function PostsPage() {
  const posts = await getPosts()
  
  return (
    &lt;div&gt;
      {posts.map(post => (
        &lt;PostCard key={post.id} post={post} /&gt;
      ))}
    &lt;/div&gt;
  )
}</code></pre>

                <h3 id="when-use-client">When to use 'use client'</h3>
                <ul>
                  <li>Need useState, useEffect, or other React hooks</li>
                  <li>Event listeners (onClick, onChange, etc.)</li>
                  <li>Browser-only APIs (localStorage, window, etc.)</li>
                  <li>Third-party libraries that use client-side features</li>
                </ul>
              </div>`
            },
            {
              id: 'nextjs-page-3',
              title: 'Data Fetching Strategies',
              content: `<div class="prose max-w-none">
                <h2 id="data-fetching">Data Fetching Strategies</h2>
                
                <h3 id="ssr">Server-Side Rendering (SSR)</h3>
                <p>Fetch data on each request. Use for dynamic, user-specific content.</p>
                <pre class="bg-gray-100 p-4 rounded-lg"><code>// By default, fetch requests are cached
async function getData() {
  const res = await fetch('https://api.example.com/data', {
    cache: 'no-store' // Disable caching for SSR
  })
  return res.json()
}</code></pre>

                <h3 id="ssg">Static Site Generation (SSG)</h3>
                <p>Pre-render pages at build time. Perfect for content that doesn't change often.</p>
                <pre class="bg-gray-100 p-4 rounded-lg"><code>// Cached by default
async function getData() {
  const res = await fetch('https://api.example.com/data')
  return res.json()
}

// Revalidate every hour
async function getDataWithRevalidation() {
  const res = await fetch('https://api.example.com/data', {
    next: { revalidate: 3600 }
  })
  return res.json()
}</code></pre>

                <h3 id="isr">Incremental Static Regeneration (ISR)</h3>
                <p>Update static pages after deployment without rebuilding.</p>
                <pre class="bg-gray-100 p-4 rounded-lg"><code>export const revalidate = 60 // Revalidate every 60 seconds

export default async function Page() {
  const data = await fetch('https://api.example.com/data')
  const posts = await data.json()
  
  return &lt;div&gt;{/* render posts */}&lt;/div&gt;
}</code></pre>

                <div class="bg-green-50 p-4 rounded-lg my-4">
                  <h5>🎯 Best Practices:</h5>
                  <ul>
                    <li>Use SSG for blog posts, marketing pages</li>
                    <li>Use ISR for product catalogs, news feeds</li>
                    <li>Use SSR for dashboards, user profiles</li>
                    <li>Combine strategies in the same app!</li>
                  </ul>
                </div>

                <h3 id="parallel-fetching">Parallel Data Fetching</h3>
                <pre class="bg-gray-100 p-4 rounded-lg"><code>// Fetch multiple resources in parallel
const [users, posts, comments] = await Promise.all([
  fetch('/api/users').then(r => r.json()),
  fetch('/api/posts').then(r => r.json()),
  fetch('/api/comments').then(r => r.json())
])</code></pre>
              </div>`
            },
            {
              id: 'nextjs-page-4',
              title: 'Advanced Routing',
              content: `<div class="prose max-w-none">
                <h2 id="routing">Advanced Routing</h2>
                
                <h3 id="dynamic-routes">Dynamic Routes</h3>
                <pre class="bg-gray-100 p-4 rounded-lg"><code>// app/blog/[slug]/page.tsx
export default function BlogPost({ 
  params 
}: { 
  params: { slug: string } 
}) {
  return &lt;h1&gt;Post: {params.slug}&lt;/h1&gt;
}

// Generate static params at build time
export async function generateStaticParams() {
  const posts = await fetch('https://api.example.com/posts').then(r => r.json())
  
  return posts.map((post) => ({
    slug: post.slug,
  }))
}</code></pre>

                <h3 id="route-groups">Route Groups</h3>
                <p>Organize routes without affecting the URL structure using parentheses:</p>
                <pre class="bg-gray-100 p-4 rounded-lg"><code>app/
├── (marketing)/
│   ├── about/
│   └── contact/
└── (shop)/
    ├── products/
    └── cart/

// URLs: /about, /contact, /products, /cart</code></pre>

                <h3 id="parallel-routes">Parallel Routes</h3>
                <p>Render multiple pages in the same layout simultaneously:</p>
                <pre class="bg-gray-100 p-4 rounded-lg"><code>app/
├── @team/
│   └── page.tsx
├── @analytics/
│   └── page.tsx
└── layout.tsx

// layout.tsx
export default function Layout({ 
  team, 
  analytics 
}: { 
  team: React.ReactNode
  analytics: React.ReactNode 
}) {
  return (
    &lt;&gt;
      {team}
      {analytics}
    &lt;/&gt;
  )
}</code></pre>

                <h3 id="intercepting-routes">Intercepting Routes</h3>
                <p>Load a route within the current layout while keeping context:</p>
                <pre class="bg-gray-100 p-4 rounded-lg"><code>app/
├── photo/
│   └── [id]/
│       └── page.tsx
└── @modal/
    └── (.)photo/
        └── [id]/
            └── page.tsx

// Opens photo in modal when clicked from gallery
// Direct navigation shows full page</code></pre>
              </div>`
            },
            {
              id: 'nextjs-page-5',
              title: 'Performance Optimization',
              content: `<div class="prose max-w-none">
                <h2 id="optimization">Performance Optimization</h2>
                
                <h3 id="image-optimization">Image Optimization</h3>
                <pre class="bg-gray-100 p-4 rounded-lg"><code>import Image from 'next/image'

export default function Avatar() {
  return (
    &lt;Image
      src="/avatar.jpg"
      alt="User avatar"
      width={100}
      height={100}
      priority // Load immediately
      placeholder="blur" // Show blur while loading
      blurDataURL="data:image/..." // Optional blur image
    /&gt;
  )
}</code></pre>

                <h3 id="font-optimization">Font Optimization</h3>
                <pre class="bg-gray-100 p-4 rounded-lg"><code>import { Inter, Roboto_Mono } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
})

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
})

export default function Layout({ children }) {
  return (
    &lt;html className={inter.className}&gt;
      &lt;body&gt;{children}&lt;/body&gt;
    &lt;/html&gt;
  )
}</code></pre>

                <h3 id="code-splitting">Code Splitting</h3>
                <pre class="bg-gray-100 p-4 rounded-lg"><code>// Dynamic imports for code splitting
import dynamic from 'next/dynamic'

const DynamicChart = dynamic(() => import('@/components/Chart'), {
  loading: () => &lt;p&gt;Loading chart...&lt;/p&gt;,
  ssr: false // Disable server-side rendering
})

export default function Dashboard() {
  return &lt;DynamicChart /&gt;
}</code></pre>

                <h3 id="metadata-seo">Metadata for SEO</h3>
                <pre class="bg-gray-100 p-4 rounded-lg"><code>// app/page.tsx
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Next.js App',
  description: 'My awesome Next.js application',
  openGraph: {
    title: 'Next.js App',
    description: 'My awesome Next.js application',
    images: ['/og-image.jpg'],
  },
}

// Dynamic metadata
export async function generateMetadata({ params }) {
  const post = await fetch(\`/api/posts/\${params.id}\`).then(r => r.json())
  
  return {
    title: post.title,
    description: post.excerpt,
  }
}</code></pre>

                <div class="bg-purple-50 p-4 rounded-lg my-4">
                  <h5>⚡ Performance Checklist:</h5>
                  <ul>
                    <li>✅ Use Server Components by default</li>
                    <li>✅ Implement proper caching strategies</li>
                    <li>✅ Optimize images with next/image</li>
                    <li>✅ Use dynamic imports for large components</li>
                    <li>✅ Enable compression in production</li>
                    <li>✅ Implement proper error boundaries</li>
                    <li>✅ Monitor Core Web Vitals</li>
                  </ul>
                </div>
              </div>`
            }
          ],
          createdAt: '2025-11-22',
          updatedAt: '2025-11-26'
        }
      ]
    }
  ])
  const [expandedSpaces, setExpandedSpaces] = useState<Set<string>>(new Set(['1', '2']))
  const [spaceDialogOpen, setSpaceDialogOpen] = useState(false)
  const [subspaceDialogOpen, setSubspaceDialogOpen] = useState(false)
  const [subspaceParentId, setSubspaceParentId] = useState<string | null>(null)
  const [newSpaceName, setNewSpaceName] = useState('')
  const [selectedIcon, setSelectedIcon] = useState('Smile')
  const [activeSpace, setActiveSpace] = useState<string | null>(spaces[0]?.id || null)
  const [showIconPicker, setShowIconPicker] = useState(false)
  const [activeNote, setActiveNote] = useState<string | null>(null)
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0)
  const [currentView, setCurrentView] = useState<'spaces' | 'workspace' | 'chat' | 'settings'>('spaces')
  
  // Chat-related state
  const [chatFolders, setChatFolders] = useState<ChatFolder[]>([
    {
      id: 'folder-1',
      name: 'AI Development',
      chats: [
        {
          id: 'chat-1',
          title: 'React Best Practices',
          messages: [
            { id: 'msg-1', role: 'user', content: 'What are the best practices for React hooks?', timestamp: '2025-11-26 10:30' },
            { id: 'msg-2', role: 'assistant', content: 'Here are some key best practices for React hooks:\n\n1. **Always call hooks at the top level** - Never call hooks inside loops, conditions, or nested functions.\n\n2. **Only call hooks from React functions** - Call them from functional components or custom hooks.\n\n3. **Use ESLint plugin** - Install eslint-plugin-react-hooks to catch common mistakes.\n\n4. **Custom hooks naming** - Always start with "use" (e.g., useForm, useAuth).\n\n5. **Optimize with useMemo and useCallback** - Prevent unnecessary re-renders.\n\nWould you like me to elaborate on any of these?', timestamp: '2025-11-26 10:31' }
          ],
          createdAt: '2025-11-26',
          updatedAt: '2025-11-26',
          folderId: 'folder-1'
        }
      ]
    },
    {
      id: 'folder-2',
      name: 'General',
      chats: []
    }
  ])
  const [unorganizedChats, setUnorganizedChats] = useState<Chat[]>([
    {
      id: 'chat-2',
      title: 'Getting Started with TypeScript',
      messages: [
        { id: 'msg-3', role: 'user', content: 'How do I start with TypeScript?', timestamp: '2025-11-25 14:20' },
        { id: 'msg-4', role: 'assistant', content: 'Great question! Here\'s how to get started with TypeScript:\n\n1. Install TypeScript: `npm install -g typescript`\n2. Create a tsconfig.json file\n3. Write your first .ts file\n4. Compile with `tsc filename.ts`\n\nWould you like a detailed tutorial?', timestamp: '2025-11-25 14:21' }
      ],
      createdAt: '2025-11-25',
      updatedAt: '2025-11-25'
    }
  ])
  const [activeChat, setActiveChat] = useState<string | null>(null)
  const [selectedModel, setSelectedModel] = useState<string>('gpt-4')
  const [activeChatFolder, setActiveChatFolder] = useState<string | null>(null)
  
  // Tab management state
  interface ChatTab {
    id: string
    chatId: string | null
  }
  const [openChatTabs, setOpenChatTabs] = useState<ChatTab[]>([])
  const [activeChatTabId, setActiveChatTabId] = useState<string | null>(null)
  
  // Settings state
  const [apiKeys, setApiKeys] = useState({
    'openai': '',
    'anthropic': '',
    'google': '',
  })

  // Load API keys from localStorage on mount
  useEffect(() => {
    const savedKeys = localStorage.getItem('notemind_api_keys')
    if (savedKeys) {
      try {
        const parsed = JSON.parse(savedKeys)
        setApiKeys(parsed)
      } catch (error) {
        console.error('Failed to parse saved API keys:', error)
      }
    }
  }, [])

  // Keyboard shortcuts for tab management
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+T or Cmd+T: New chat tab
      if ((e.ctrlKey || e.metaKey) && e.key === 't' && currentView === 'chat') {
        e.preventDefault()
        handleCreateNewChatTab()
      }
      
      // Ctrl+W or Cmd+W: Close current tab
      if ((e.ctrlKey || e.metaKey) && e.key === 'w' && currentView === 'chat' && activeChatTabId) {
        e.preventDefault()
        handleCloseChatTab(activeChatTabId)
      }

      // Ctrl+Tab: Switch to next tab
      if (e.ctrlKey && e.key === 'Tab' && currentView === 'chat' && openChatTabs.length > 0) {
        e.preventDefault()
        const currentIndex = openChatTabs.findIndex(tab => tab.id === activeChatTabId)
        const nextIndex = (currentIndex + 1) % openChatTabs.length
        handleSwitchChatTab(openChatTabs[nextIndex].id)
      }

      // Ctrl+Shift+Tab: Switch to previous tab
      if (e.ctrlKey && e.shiftKey && e.key === 'Tab' && currentView === 'chat' && openChatTabs.length > 0) {
        e.preventDefault()
        const currentIndex = openChatTabs.findIndex(tab => tab.id === activeChatTabId)
        const prevIndex = (currentIndex - 1 + openChatTabs.length) % openChatTabs.length
        handleSwitchChatTab(openChatTabs[prevIndex].id)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentView, activeChatTabId, openChatTabs])

  const getIconComponent = (iconName: string) => {
    const icon = availableIcons.find(i => i.name === iconName)
    return icon ? icon.component : Smile
  }

  const toggleExpanded = (spaceId: string) => {
    const newExpanded = new Set(expandedSpaces)
    if (newExpanded.has(spaceId)) {
      newExpanded.delete(spaceId)
    } else {
      newExpanded.add(spaceId)
    }
    setExpandedSpaces(newExpanded)
  }

  const handleCreateSpace = () => {
    if (newSpaceName.trim()) {
      const newSpace: Space = {
        id: Date.now().toString(),
        name: newSpaceName.trim(),
        icon: selectedIcon,
        subspaces: []
      }
      setSpaces([...spaces, newSpace])
      setNewSpaceName('')
      setSelectedIcon('Smile')
      setSpaceDialogOpen(false)
      setShowIconPicker(false)
    }
  }

  const handleCreateSubspace = () => {
    if (newSpaceName.trim() && subspaceParentId) {
      const newSubspace: Space = {
        id: `${subspaceParentId}-${Date.now()}`,
        name: newSpaceName.trim(),
        icon: selectedIcon,
        parentId: subspaceParentId,
        subspaces: []
      }
      
      // Recursive function to add subspace at any level
      const addSubspaceRecursively = (space: Space): Space => {
        if (space.id === subspaceParentId) {
          return {
            ...space,
            subspaces: [...(space.subspaces || []), newSubspace]
          }
        }
        
        if (space.subspaces) {
          return {
            ...space,
            subspaces: space.subspaces.map(addSubspaceRecursively)
          }
        }
        
        return space
      }
      
      setSpaces(spaces.map(addSubspaceRecursively))
      
      setNewSpaceName('')
      setSelectedIcon('Smile')
      setSubspaceDialogOpen(false)
      setSubspaceParentId(null)
      setShowIconPicker(false)
      setExpandedSpaces(new Set([...Array.from(expandedSpaces), subspaceParentId]))
    }
  }

  const openSpaceDialog = () => {
    setNewSpaceName('')
    setSelectedIcon('Smile')
    setShowIconPicker(false)
    setSpaceDialogOpen(true)
  }

  const openSubspaceDialog = (parentId: string) => {
    setNewSpaceName('')
    setSelectedIcon('Smile')
    setShowIconPicker(false)
    setSubspaceParentId(parentId)
    setSubspaceDialogOpen(true)
  }

  const closeSpaceDialog = () => {
    setSpaceDialogOpen(false)
    setNewSpaceName('')
    setSelectedIcon('Smile')
    setShowIconPicker(false)
  }

  const closeSubspaceDialog = () => {
    setSubspaceDialogOpen(false)
    setSubspaceParentId(null)
    setNewSpaceName('')
    setSelectedIcon('Smile')
    setShowIconPicker(false)
  }

  const handleDeleteSpace = (spaceId: string) => {
    // Recursive function to delete space at any level
    const deleteSpaceRecursively = (space: Space): Space | null => {
      if (space.id === spaceId) {
        return null
      }
      
      if (space.subspaces) {
        return {
          ...space,
          subspaces: space.subspaces
            .map(deleteSpaceRecursively)
            .filter((s): s is Space => s !== null)
        }
      }
      
      return space
    }
    
    setSpaces(
      spaces
        .map(deleteSpaceRecursively)
        .filter((s): s is Space => s !== null)
    )
    
    if (activeSpace === spaceId) {
      setActiveSpace(spaces[0]?.id || null)
    }
  }

  const findSpaceById = (id: string): Space | null => {
    // Recursive function to search through all levels
    const searchSpace = (space: Space): Space | null => {
      if (space.id === id) return space
      
      if (space.subspaces) {
        for (const subspace of space.subspaces) {
          const found = searchSpace(subspace)
          if (found) return found
        }
      }
      
      return null
    }
    
    for (const space of spaces) {
      const found = searchSpace(space)
      if (found) return found
    }
    
    return null
  }

  const getAllSubspaces = (spaceId: string): Space[] => {
    const space = spaces.find(s => s.id === spaceId)
    return space?.subspaces || []
  }

  // Tab management functions
  const handleOpenChatTab = (chatId: string | null) => {
    // Check if tab already exists
    const existingTab = openChatTabs.find(tab => tab.chatId === chatId)
    if (existingTab) {
      setActiveChatTabId(existingTab.id)
      setActiveChat(chatId)
      setCurrentView('chat')
      return
    }
    
    // Create new tab
    const newTab: ChatTab = {
      id: `tab-${Date.now()}`,
      chatId
    }
    
    setOpenChatTabs([...openChatTabs, newTab])
    setActiveChatTabId(newTab.id)
    setActiveChat(chatId)
    setCurrentView('chat')
  }

  const handleBackToWorkspace = () => {
    setCurrentView('workspace')
    setActiveChat(null)
    setActiveChatTabId(null)
  }

  const handleCloseChatTab = (tabId: string) => {
    const updatedTabs = openChatTabs.filter(tab => tab.id !== tabId)
    setOpenChatTabs(updatedTabs)
    
    // If closing the active tab, switch to another tab or set to null
    if (tabId === activeChatTabId) {
      if (updatedTabs.length > 0) {
        const lastTab = updatedTabs[updatedTabs.length - 1]
        setActiveChatTabId(lastTab.id)
        setActiveChat(lastTab.chatId)
      } else {
        // No more tabs, return to workspace
        setActiveChatTabId(null)
        setActiveChat(null)
        setCurrentView('workspace')
      }
    }
  }

  const handleSwitchChatTab = (tabId: string) => {
    const tab = openChatTabs.find(t => t.id === tabId)
    if (tab) {
      setActiveChatTabId(tabId)
      setActiveChat(tab.chatId)
    }
  }

  const handleCreateNewChatTab = () => {
    const newChat: Chat = {
      id: `chat-${Date.now()}`,
      title: 'New Chat',
      messages: [],
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    }
    setUnorganizedChats([newChat, ...unorganizedChats])
    handleOpenChatTab(newChat.id)
  }

  const handleMoveChatToFolder = (chatId: string, folderId: string | null) => {
    // Find the chat in all folders and unorganized
    let chatToMove: Chat | null = null
    let sourceFolderId: string | null = null

    // Check in folders
    for (const folder of chatFolders) {
      const chat = folder.chats.find(c => c.id === chatId)
      if (chat) {
        chatToMove = chat
        sourceFolderId = folder.id
        break
      }
    }

    // Check in unorganized
    if (!chatToMove) {
      const chat = unorganizedChats.find(c => c.id === chatId)
      if (chat) {
        chatToMove = chat
      }
    }

    if (!chatToMove) return

    // Remove from source
    if (sourceFolderId) {
      // Remove from folder
      setChatFolders(chatFolders.map(folder => 
        folder.id === sourceFolderId
          ? { ...folder, chats: folder.chats.filter(c => c.id !== chatId) }
          : folder
      ))
    } else {
      // Remove from unorganized
      setUnorganizedChats(unorganizedChats.filter(c => c.id !== chatId))
    }

    // Add to destination
    if (folderId) {
      // Add to folder
      setChatFolders(chatFolders.map(folder =>
        folder.id === folderId
          ? { ...folder, chats: [...folder.chats, { ...chatToMove!, folderId }] }
          : folder
      ))
    } else {
      // Add to unorganized
      const { folderId: _, ...chatWithoutFolder } = chatToMove
      setUnorganizedChats([chatWithoutFolder, ...unorganizedChats])
    }
  }

  const handleCreateChatFolder = (folderName: string) => {
    const newFolder: ChatFolder = {
      id: `folder-${Date.now()}`,
      name: folderName,
      chats: []
    }
    setChatFolders([...chatFolders, newFolder])
  }

  const renderSpaceItem = (space: Space, level: number = 0) => {
    const IconComponent = getIconComponent(space.icon)
    const hasSubspaces = space.subspaces && space.subspaces.length > 0
    const isExpanded = expandedSpaces.has(space.id)
    const isActive = activeSpace === space.id

    return (
      <div key={space.id}>
        <div
          className={`group flex items-center gap-2 py-1.5 px-2 rounded-lg transition-colors cursor-pointer ${
            isActive
              ? 'bg-purple-50 text-purple-700'
              : 'hover:bg-gray-100 text-gray-700'
          }`}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
        >
          {/* Expand/Collapse Button - Show for any space with subspaces */}
          {hasSubspaces ? (
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleExpanded(space.id)
              }}
              className="p-0.5 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
            >
              {isExpanded ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </button>
          ) : (
            <div className="w-4 flex-shrink-0" />
          )}
          
          {/* Space Content */}
          <div 
            className="flex items-center gap-2 flex-1 min-w-0"
            onClick={() => {
              setActiveSpace(space.id)
              setCurrentView('spaces')
            }}
          >
            <IconComponent className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm font-medium truncate">{space.name}</span>
          </div>

          {/* Action Buttons */}
          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation()
                openSubspaceDialog(space.id)
              }}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
              title="Add Note"
            >
              <Plus className="h-3 w-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleDeleteSpace(space.id)
              }}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
              title="Delete"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Render Subspaces */}
        {hasSubspaces && isExpanded && (
          <div className="space-y-0.5">
            {space.subspaces!.map(subspace => renderSpaceItem(subspace, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="h-6 w-6 text-purple-600" />
            <span className="text-lg font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              NoteMind
            </span>
          </div>
          
          {/* User Section */}
          <button className="w-full flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold text-sm">
              U
            </div>
            <span className="flex-1 text-left text-sm font-medium text-gray-700">User Account</span>
            <ChevronDown className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        {/* Navigation */}
        <div className="p-3 space-y-1">
          <button className="w-full flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-700">
            <Search className="h-5 w-5" />
            <span className="text-sm font-medium">Search</span>
          </button>
          <button 
            onClick={() => setCurrentView('workspace')}
            className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
              currentView === 'workspace' || currentView === 'chat'
                ? 'bg-purple-50 text-purple-700' 
                : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            <MessageSquare className="h-5 w-5" />
            <span className="text-sm font-medium">Workspace</span>
          </button>
          <button 
            onClick={() => setCurrentView('settings')}
            className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
              currentView === 'settings' 
                ? 'bg-purple-50 text-purple-700' 
                : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            <Settings className="h-5 w-5" />
            <span className="text-sm font-medium">Settings</span>
          </button>
        </div>

        <div className="h-px bg-gray-200 mx-3 my-2"></div>

        {/* Notes Section - Always Visible at Bottom */}
        <div className="flex-1 overflow-y-auto p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Notes</span>
            <button
              onClick={openSpaceDialog}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="Add Note"
            >
              <Plus className="h-4 w-4 text-gray-500" />
            </button>
          </div>

          {/* Notes List */}
          <div className="space-y-0.5">
            {spaces.map((space) => renderSpaceItem(space, 0))}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar - Hidden for chat view */}
        {currentView !== 'chat' && (
          <header className="h-14 border-b border-gray-200 bg-white flex items-center px-6">
            <div className="flex-1">
              {currentView === 'spaces' && activeSpace && (
                <div className="flex items-center gap-2">
                  {(() => {
                    const space = findSpaceById(activeSpace)
                    if (!space) return null
                    const IconComponent = getIconComponent(space.icon)
                    return (
                      <>
                        <IconComponent className="h-5 w-5 text-purple-600" />
                        <h1 className="text-lg font-semibold text-gray-900">{space.name}</h1>
                        {space.parentId && (
                          <span className="text-sm text-gray-500">
                            (Subspace of {findSpaceById(space.parentId)?.name})
                          </span>
                        )}
                      </>
                    )
                  })()}
                </div>
              )}
              {currentView === 'workspace' && (
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-5 w-5 text-purple-600" />
                  <h1 className="text-lg font-semibold text-gray-900">Workspace</h1>
                </div>
              )}
              {currentView === 'settings' && (
                <div className="flex items-center gap-3">
                  <Settings className="h-5 w-5 text-purple-600" />
                  <h1 className="text-lg font-semibold text-gray-900">Settings</h1>
                </div>
              )}
            </div>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <MoreHorizontal className="h-5 w-5 text-gray-600" />
            </button>
          </header>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto flex flex-col">
          {currentView === 'chat' ? (
            // Chat Interface with Tabs
            <div className="flex flex-col h-full">
              {/* Tab Bar */}
              <div className="border-b border-gray-200 bg-white overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                <div className="flex items-center gap-1 py-2 px-2">
                  {/* Back Button */}
                  <button
                    onClick={handleBackToWorkspace}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0 mr-1"
                    title="Back to Workspace"
                  >
                    <ChevronRight className="h-4 w-4 text-gray-600 rotate-180" />
                  </button>

                  {/* Chat Tabs */}
                  {openChatTabs.map((tab) => {
                    const chat = [...chatFolders.flatMap(f => f.chats), ...unorganizedChats].find(c => c.id === tab.chatId)
                    const isActive = tab.id === activeChatTabId
                    
                    return (
                      <div
                        key={tab.id}
                        title={chat?.title || 'New Chat'}
                        className={`group flex items-center gap-2 px-3 py-2 rounded-t-lg border-b-2 transition-all cursor-pointer min-w-[160px] max-w-[220px] flex-shrink-0 ${
                          isActive
                            ? 'bg-purple-50 border-purple-600 text-purple-700 shadow-sm'
                            : 'bg-transparent border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <button
                          onClick={() => handleSwitchChatTab(tab.id)}
                          className="flex items-center gap-2 flex-1 min-w-0"
                        >
                          <MessageSquare className="h-3.5 w-3.5 flex-shrink-0" />
                          <span className="text-sm font-medium truncate">
                            {chat?.title || 'New Chat'}
                          </span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleCloseChatTab(tab.id)
                          }}
                          className={`p-0.5 rounded hover:bg-gray-200 transition-all flex-shrink-0 ${
                            isActive ? 'opacity-70 hover:opacity-100' : 'opacity-0 group-hover:opacity-70 group-hover:hover:opacity-100'
                          }`}
                          title="Close tab"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )
                  })}
                  
                  {/* Add New Tab Button - Inline with tabs */}
                  <button
                    onClick={handleCreateNewChatTab}
                    className="p-2 hover:bg-purple-50 rounded-lg transition-colors flex-shrink-0 text-purple-600 hover:text-purple-700"
                    title="New chat tab (Ctrl+T)"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Active Chat Content */}
              {activeChat ? (
                <div className="flex-1 overflow-hidden">
                  <ChatComponent
                    activeChat={activeChat}
                    chatFolders={chatFolders}
                    unorganizedChats={unorganizedChats}
                    selectedModel={selectedModel}
                    openTabs={openChatTabs}
                    activeTabId={activeChatTabId}
                    onUpdateChatFolders={setChatFolders}
                    onUpdateUnorganizedChats={setUnorganizedChats}
                    onSetSelectedModel={setSelectedModel}
                    onOpenTab={handleOpenChatTab}
                    onCloseTab={handleCloseChatTab}
                    onSwitchTab={handleSwitchChatTab}
                    onCreateNewChat={handleCreateNewChatTab}
                    onMoveChatToFolder={handleMoveChatToFolder}
                    onCreateFolder={handleCreateChatFolder}
                  />
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">No Chat Selected</h2>
                    <p className="text-gray-600 mb-4">
                      Click the + button to start a new chat
                    </p>
                    <button
                      onClick={handleCreateNewChatTab}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium inline-flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      New Chat
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : currentView === 'workspace' ? (
            // Chat Page - Shows all chats overview
            <div className="p-6">
              <div className="max-w-5xl mx-auto">
                {activeChatFolder ? (
                  // Inside a folder - show chats within the folder
                  (() => {
                    const folder = chatFolders.find(f => f.id === activeChatFolder)
                    if (!folder) return null
                    
                    return (
                      <>
                        {/* Back button and folder header */}
                        <div className="mb-6">
                          <button
                            onClick={() => setActiveChatFolder(null)}
                            className="flex items-center gap-2 text-sm text-gray-600 hover:text-purple-700 mb-3 transition-colors"
                          >
                            <ChevronRight className="h-4 w-4 rotate-180" />
                            Back to all folders
                          </button>
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                                <Folder className="h-5 w-5" />
                              </div>
                              <div>
                                <h2 className="text-2xl font-bold text-gray-900">{folder.name}</h2>
                                <p className="text-sm text-gray-600">{folder.chats.length} chat{folder.chats.length !== 1 ? 's' : ''}</p>
                              </div>
                            </div>
                            <button
                              onClick={handleCreateNewChatTab}
                              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium inline-flex items-center gap-2"
                            >
                              <Plus className="h-4 w-4" />
                              New Chat
                            </button>
                          </div>
                        </div>

                        {/* Chats in this folder */}
                        {folder.chats.length > 0 ? (
                          <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
                            {folder.chats
                              .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                              .map((chat) => (
                              <button
                                key={chat.id}
                                onClick={() => handleOpenChatTab(chat.id)}
                                className="w-full group flex items-center gap-3 px-4 py-2.5 hover:bg-purple-50 transition-all text-left"
                              >
                                <MessageSquare className="h-4 w-4 text-purple-600 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-sm font-semibold text-gray-900 group-hover:text-purple-700 transition-colors truncate">
                                    {chat.title}
                                  </h4>
                                  <div className="flex items-center gap-3 mt-0.5">
                                    <span className="text-xs text-gray-500">{chat.updatedAt}</span>
                                    <span className="text-xs text-gray-400">•</span>
                                    <span className="text-xs text-gray-500">{chat.messages.length} msg{chat.messages.length !== 1 ? 's' : ''}</span>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                            <MessageSquare className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                            <h3 className="text-sm font-semibold text-gray-900 mb-1">No chats in this folder</h3>
                            <p className="text-xs text-gray-600">Move chats to this folder to organize them</p>
                          </div>
                        )}
                      </>
                    )
                  })()
                ) : (
                  // Main view - show all folders and unorganized chats
                  <>
                    <div className="mb-6 flex items-start justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-1">All Chats</h2>
                        <p className="text-sm text-gray-600">
                          Manage and organize your conversations
                        </p>
                      </div>
                      <button
                        onClick={handleCreateNewChatTab}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium inline-flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        New Chat
                      </button>
                    </div>

                    {/* Chat Folders */}
                    {chatFolders.length > 0 && (
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                            <Folder className="h-4 w-4" />
                            Organized Chats
                          </h3>
                        </div>
                        <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
                          {chatFolders.map((folder) => (
                            <button
                              key={folder.id}
                              onClick={() => setActiveChatFolder(folder.id)}
                              className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-purple-50 transition-colors text-left group"
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className="w-8 h-8 rounded bg-purple-100 text-purple-600 group-hover:bg-purple-200 flex items-center justify-center flex-shrink-0 transition-colors">
                                  <Folder className="h-4 w-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-sm font-semibold text-gray-900 group-hover:text-purple-700 truncate transition-colors">{folder.name}</h4>
                                  <p className="text-xs text-gray-500">{folder.chats.length} chat{folder.chats.length !== 1 ? 's' : ''}</p>
                                </div>
                              </div>
                              <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-purple-600 transition-colors flex-shrink-0" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Unorganized Chats */}
                    {unorganizedChats.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            Unorganized Chats
                          </h3>
                        </div>
                        <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
                          {unorganizedChats
                            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                            .map((chat) => (
                            <button
                              key={chat.id}
                              onClick={() => handleOpenChatTab(chat.id)}
                              className="w-full group flex items-center gap-3 px-4 py-2.5 hover:bg-purple-50 transition-all text-left"
                            >
                              <div className="w-8 h-8 rounded bg-gray-100 text-gray-600 flex items-center justify-center group-hover:bg-purple-100 group-hover:text-purple-600 transition-colors flex-shrink-0">
                                <MessageSquare className="h-4 w-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-semibold text-gray-900 group-hover:text-purple-700 transition-colors truncate">
                                  {chat.title}
                                </h4>
                                <div className="flex items-center gap-3 mt-0.5">
                                  <span className="text-xs text-gray-500">{chat.updatedAt}</span>
                                  <span className="text-xs text-gray-400">•</span>
                                  <span className="text-xs text-gray-500">{chat.messages.length} message{chat.messages.length !== 1 ? 's' : ''}</span>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Empty State */}
                    {chatFolders.length === 0 && unorganizedChats.length === 0 && (
                      <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
                        <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">No Chats Yet</h3>
                        <p className="text-sm text-gray-600 mb-4">Start a new conversation to get started</p>
                        <button
                          onClick={handleCreateNewChatTab}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium inline-flex items-center gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          New Chat
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ) : currentView === 'settings' ? (
            // Settings Page
            <div className="p-8">
              <div className="max-w-3xl mx-auto">
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Settings</h2>
                  <p className="text-gray-600">
                    Configure your API keys and preferences
                  </p>
                </div>

                {/* API Keys Section */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">API Keys</h3>
                    <p className="text-sm text-gray-600">
                      Configure your API keys to use different AI models. Your keys are stored locally and never sent to our servers.
                    </p>
                  </div>

                  <div className="space-y-6">
                    {/* OpenAI API Key */}
                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-2 block">
                        OpenAI API Key
                      </label>
                      <p className="text-xs text-gray-500 mb-2">
                        For GPT-4, GPT-4 Turbo, and GPT-3.5 Turbo models
                      </p>
                      <input
                        type="password"
                        value={apiKeys.openai}
                        onChange={(e) => {
                          const newKeys = { ...apiKeys, openai: e.target.value }
                          setApiKeys(newKeys)
                          localStorage.setItem('notemind_api_keys', JSON.stringify(newKeys))
                        }}
                        placeholder="sk-..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none text-sm font-mono"
                      />
                    </div>

                    {/* Anthropic API Key */}
                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-2 block">
                        Anthropic API Key
                      </label>
                      <p className="text-xs text-gray-500 mb-2">
                        For Claude 3 Opus, Claude 3 Sonnet, and Claude 3 Haiku models
                      </p>
                      <input
                        type="password"
                        value={apiKeys.anthropic}
                        onChange={(e) => {
                          const newKeys = { ...apiKeys, anthropic: e.target.value }
                          setApiKeys(newKeys)
                          localStorage.setItem('notemind_api_keys', JSON.stringify(newKeys))
                        }}
                        placeholder="sk-ant-..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none text-sm font-mono"
                      />
                    </div>

                    {/* Google API Key */}
                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-2 block">
                        Google AI API Key
                      </label>
                      <p className="text-xs text-gray-500 mb-2">
                        For Gemini Pro and other Google AI models
                      </p>
                      <input
                        type="password"
                        value={apiKeys.google}
                        onChange={(e) => {
                          const newKeys = { ...apiKeys, google: e.target.value }
                          setApiKeys(newKeys)
                          localStorage.setItem('notemind_api_keys', JSON.stringify(newKeys))
                        }}
                        placeholder="AIza..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none text-sm font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-base font-semibold text-blue-900 mb-3">How to get API keys:</h4>
                      <ul className="text-sm text-blue-800 space-y-2">
                        <li className="flex items-start gap-2">
                          <span className="font-medium min-w-[100px]">OpenAI:</span>
                          <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-600 break-all">
                            platform.openai.com/api-keys
                          </a>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="font-medium min-w-[100px]">Anthropic:</span>
                          <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-600 break-all">
                            console.anthropic.com/settings/keys
                          </a>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="font-medium min-w-[100px]">Google AI:</span>
                          <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-600 break-all">
                            makersuite.google.com/app/apikey
                          </a>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : activeSpace && activeNote ? (
            // Show Note Content
            (() => {
              const currentSpace = findSpaceById(activeSpace)
              const note = currentSpace?.notes?.find(n => n.id === activeNote)
              
              if (!note) return null

              const renderTOCItem = (item: TOCItem, index: number) => {
                return (
                  <div key={item.id}>
                    <button
                      onClick={() => {
                        const element = document.getElementById(item.id)
                        if (element) {
                          const yOffset = -100
                          const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset
                          window.scrollTo({ top: y, behavior: 'smooth' })
                        }
                      }}
                      className="w-full flex items-start gap-3 p-2 rounded-lg text-left transition-all hover:bg-white shadow-sm text-gray-700 hover:text-purple-700"
                    >
                      <span className="flex-shrink-0 text-purple-600 font-semibold text-sm">
                        {index + 1}.
                      </span>
                      <span className="text-sm flex-1">{item.title}</span>
                    </button>
                    {item.children && item.children.length > 0 && (
                      <div className="ml-6 mt-1 space-y-1">
                        {item.children.map((child) => (
                          <button
                            key={child.id}
                            onClick={() => {
                              const element = document.getElementById(child.id)
                              if (element) {
                                const yOffset = -100
                                const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset
                                window.scrollTo({ top: y, behavior: 'smooth' })
                              }
                            }}
                            className="w-full flex items-start gap-2 p-2 rounded-lg text-left transition-all hover:bg-white/70 text-gray-600 text-sm hover:text-purple-600"
                          >
                            <span className="text-gray-400">└</span>
                            <span>{child.title}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              }

              return (
                <div className="flex-1 overflow-y-auto p-8">
                  <article className="max-w-5xl mx-auto">
                    {/* Back Button */}
                    <button
                      onClick={() => {
                        setActiveNote(null)
                        setCurrentPageIndex(0)
                      }}
                      className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      <ChevronDown className="h-4 w-4 rotate-90" />
                      <span className="text-sm font-medium">Back to Note</span>
                    </button>

                    {/* Note Header */}
                    <header className="mb-8">
                      <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        {note.title}
                      </h1>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Created: {note.createdAt}</span>
                        <span>•</span>
                        <span>Updated: {note.updatedAt}</span>
                        <span>•</span>
                        <span>{note.pages.length} pages</span>
                      </div>
                    </header>

                    {/* Table of Contents */}
                    <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-6 mb-12">
                      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Book className="h-5 w-5 text-purple-600" />
                        Table of Contents
                      </h2>
                      <nav className="space-y-1">
                        {note.tableOfContents.map((item, index) => renderTOCItem(item, index))}
                      </nav>
                    </div>

                    {/* All Pages Content - Vertically Stacked */}
                    <div className="space-y-12">
                      {note.pages.map((page, pageIndex) => (
                        <section 
                          key={page.id} 
                          id={note.tableOfContents[pageIndex]?.id}
                          className="bg-white rounded-xl border border-gray-200 p-8 scroll-mt-24"
                        >
                          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                            <h2 className="text-2xl font-bold text-gray-900">
                              {page.title}
                            </h2>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <span>Page {pageIndex + 1} of {note.pages.length}</span>
                            </div>
                          </div>
                          
                          <div 
                            className="prose-custom"
                            dangerouslySetInnerHTML={{ __html: page.content }}
                          />
                        </section>
                      ))}
                    </div>

                    {/* Back to Top Button */}
                    <div className="mt-12 flex justify-center">
                      <button
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium shadow-lg"
                      >
                        ↑ Back to Top
                      </button>
                    </div>
                  </article>
                </div>
              )
            })()
          ) : activeSpace ? (
            // Show Space Overview
            <div className="p-8">
              <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 text-purple-600 mb-4">
                    {(() => {
                      const space = findSpaceById(activeSpace)
                      if (!space) return null
                      const IconComponent = getIconComponent(space.icon)
                      return <IconComponent className="h-8 w-8" />
                    })()}
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    {findSpaceById(activeSpace)?.name}
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Explore your notes and organize your knowledge
                  </p>
                </div>

                {/* Notes List */}
                {(() => {
                  const currentSpace = findSpaceById(activeSpace)
                  const notes = currentSpace?.notes
                  
                  if (notes && notes.length > 0) {
                    return (
                      <div className="mb-12">
                        <h3 className="text-xl font-semibold text-gray-900 mb-4">Pages</h3>
                        <div className="grid gap-4">
                          {notes.map(note => (
                            <button
                              key={note.id}
                              onClick={() => {
                                setActiveNote(note.id)
                                setCurrentPageIndex(0)
                              }}
                              className="group p-6 bg-white rounded-xl border border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all text-left"
                            >
                              <div className="flex items-start justify-between mb-3">
                                <h4 className="text-lg font-semibold text-gray-900 group-hover:text-purple-700 transition-colors">
                                  {note.title}
                                </h4>
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                  <Book className="h-4 w-4" />
                                  <span>{note.pages.length} pages</span>
                                </div>
                              </div>
                              
                              <div className="flex flex-wrap gap-2 mb-3">
                                {note.tableOfContents.slice(0, 3).map(item => (
                                  <span 
                                    key={item.id}
                                    className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-md"
                                  >
                                    {item.title}
                                  </span>
                                ))}
                                {note.tableOfContents.length > 3 && (
                                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                                    +{note.tableOfContents.length - 3} more
                                  </span>
                                )}
                              </div>
                              
                              <div className="text-sm text-gray-500">
                                Updated: {note.updatedAt}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )
                  }
                  
                  return null
                })()}

                <button className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium shadow-lg hover:shadow-xl">
                  <Plus className="inline h-5 w-5 mr-2" />
                  Create New Page
                </button>

                {/* Show Sub-notes if this note has children */}
                {(() => {
                  const currentSpace = findSpaceById(activeSpace)
                  const subspaces = currentSpace?.subspaces
                  
                  if (!subspaces || subspaces.length === 0) return null

                  return (
                    <div className="mt-12">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-semibold text-gray-900">Notes</h3>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {subspaces.map(subspace => {
                          const IconComponent = getIconComponent(subspace.icon)
                          return (
                            <button
                              key={subspace.id}
                              onClick={() => {
                                setActiveSpace(subspace.id)
                                setCurrentView('spaces')
                              }}
                              className="group p-6 bg-white rounded-xl border border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all text-left"
                            >
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                                  <IconComponent className="h-5 w-5" />
                                </div>
                              </div>
                              <h4 className="font-semibold text-gray-900 mb-1">{subspace.name}</h4>
                              <p className="text-sm text-gray-500">Click to open</p>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })()}
              </div>
            </div>
          ) : (
            // No Space Selected
            <div className="flex items-center justify-center h-full p-8">
              <div className="text-center">
                <Brain className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">No Note Selected</h2>
                <p className="text-gray-600">
                  Select a note from the sidebar or create a new one
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Create Space Dialog */}
      <Dialog 
        open={spaceDialogOpen} 
        onClose={closeSpaceDialog}
        title="Create New Note"
      >
        <div className="space-y-4">
          {/* Icon Selector */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Icon</label>
            <button
              onClick={() => setShowIconPicker(!showIconPicker)}
              className="w-full flex items-center gap-3 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {(() => {
                const IconComponent = getIconComponent(selectedIcon)
                return <IconComponent className="h-6 w-6 text-purple-600" />
              })()}
              <span className="text-sm text-gray-700 flex-1 text-left">{selectedIcon}</span>
              <ChevronDown className="h-4 w-4 text-gray-500" />
            </button>

            {/* Icon Picker Dropdown */}
            {showIconPicker && (
              <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg grid grid-cols-6 gap-2 max-h-64 overflow-y-auto">
                {availableIcons.map(({ name, component: Icon }) => (
                  <button
                    key={name}
                    onClick={() => {
                      setSelectedIcon(name)
                      setShowIconPicker(false)
                    }}
                    className={`p-3 rounded-lg hover:bg-purple-50 transition-colors ${
                      selectedIcon === name ? 'bg-purple-100 text-purple-600' : 'text-gray-600'
                    }`}
                    title={name}
                  >
                    <Icon className="h-6 w-6 mx-auto" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Name Input */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Name</label>
            <input
              type="text"
              value={newSpaceName}
              onChange={(e) => setNewSpaceName(e.target.value)}
              placeholder="Enter note name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none text-sm"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateSpace()
                if (e.key === 'Escape') closeSpaceDialog()
              }}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={closeSpaceDialog}
              className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateSpace}
              disabled={!newSpaceName.trim()}
              className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create Note
            </button>
          </div>
        </div>
      </Dialog>

      {/* Create Subspace Dialog */}
      <Dialog 
        open={subspaceDialogOpen} 
        onClose={closeSubspaceDialog}
        title={`Create Note in ${subspaceParentId ? findSpaceById(subspaceParentId)?.name : ''}`}
      >
        <div className="space-y-4">
          {/* Icon Selector */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Icon</label>
            <button
              onClick={() => setShowIconPicker(!showIconPicker)}
              className="w-full flex items-center gap-3 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {(() => {
                const IconComponent = getIconComponent(selectedIcon)
                return <IconComponent className="h-6 w-6 text-purple-600" />
              })()}
              <span className="text-sm text-gray-700 flex-1 text-left">{selectedIcon}</span>
              <ChevronDown className="h-4 w-4 text-gray-500" />
            </button>

            {/* Icon Picker Dropdown */}
            {showIconPicker && (
              <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg grid grid-cols-6 gap-2 max-h-64 overflow-y-auto">
                {availableIcons.map(({ name, component: Icon }) => (
                  <button
                    key={name}
                    onClick={() => {
                      setSelectedIcon(name)
                      setShowIconPicker(false)
                    }}
                    className={`p-3 rounded-lg hover:bg-purple-50 transition-colors ${
                      selectedIcon === name ? 'bg-purple-100 text-purple-600' : 'text-gray-600'
                    }`}
                    title={name}
                  >
                    <Icon className="h-6 w-6 mx-auto" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Name Input */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Name</label>
            <input
              type="text"
              value={newSpaceName}
              onChange={(e) => setNewSpaceName(e.target.value)}
              placeholder="Enter note name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none text-sm"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateSubspace()
                if (e.key === 'Escape') closeSubspaceDialog()
              }}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={closeSubspaceDialog}
              className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateSubspace}
              disabled={!newSpaceName.trim()}
              className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create Note
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
