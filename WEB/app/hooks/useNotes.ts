import { useState, useEffect } from 'react'

export interface TOCItem {
  id: string
  title: string
  level: number
  pageIndex: number
  children?: TOCItem[]
}

export interface NotePage {
  id: string
  title: string
  content: string
}

export interface Note {
  id: string
  title: string
  tableOfContents: TOCItem[]
  pages: NotePage[]
  createdAt: string
  updatedAt: string
}

export interface NoteCollection {
  id: string
  name: string
  notes?: Note[]
}

// Mock data
const mockNoteCollections: NoteCollection[] = [
  {
    id: '1',
    name: 'Getting Started with AI',
    notes: [
      {
        id: 'note-1',
        title: 'Introduction to AI Concepts',
        tableOfContents: [
          {
            id: 'what-is-ai',
            title: 'What is Artificial Intelligence?',
            level: 1,
            pageIndex: 0,
            children: [
              { id: 'ai-definition', title: 'Definition and Scope', level: 2, pageIndex: 0 },
              { id: 'ai-types', title: 'Types of AI', level: 2, pageIndex: 0 }
            ]
          },
          {
            id: 'machine-learning',
            title: 'Machine Learning Basics',
            level: 1,
            pageIndex: 1,
            children: [
              { id: 'supervised', title: 'Supervised Learning', level: 2, pageIndex: 1 },
              { id: 'unsupervised', title: 'Unsupervised Learning', level: 2, pageIndex: 1 }
            ]
          }
        ],
        pages: [
          {
            id: 'page-1',
            title: 'What is Artificial Intelligence?',
            content: `<div class="prose max-w-none">
              <h2 id="what-is-ai">What is Artificial Intelligence?</h2>
              <p>Artificial Intelligence (AI) refers to the simulation of human intelligence in machines that are programmed to think and learn like humans. It encompasses various technologies and techniques that enable computers to perform tasks that typically require human intelligence.</p>

              <h3 id="ai-definition">Definition and Scope</h3>
              <p>AI can be broadly categorized into two main types:</p>
              <ul>
                <li><strong>Narrow AI (Weak AI):</strong> Designed to perform specific tasks, such as facial recognition or language translation.</li>
                <li><strong>General AI (Strong AI):</strong> Hypothetical AI that can understand, learn, and apply knowledge across a wide range of tasks, similar to human intelligence.</li>
              </ul>

              <h3 id="ai-types">Types of AI</h3>
              <div class="bg-blue-50 p-4 rounded-lg my-4">
                <h4 class="font-semibold mb-2">Key Categories:</h4>
                <ol>
                  <li>Reactive Machines - Simple AI that reacts to inputs</li>
                  <li>Limited Memory - AI that uses past data to make decisions</li>
                  <li>Theory of Mind - AI that understands emotions (still in development)</li>
                  <li>Self-Aware AI - Hypothetical AI with consciousness</li>
                </ol>
              </div>

              <blockquote class="border-l-4 border-purple-500 pl-4 italic my-4">
                "AI is not just about making machines intelligent, but about augmenting human capabilities and solving complex problems."
              </blockquote>
            </div>`
          },
          {
            id: 'page-2',
            title: 'Machine Learning Basics',
            content: `<div class="prose max-w-none">
              <h2 id="machine-learning">Machine Learning Basics</h2>
              <p>Machine Learning (ML) is a subset of AI that focuses on enabling systems to learn and improve from experience without being explicitly programmed. It's the driving force behind many modern AI applications.</p>

              <h3 id="supervised">Supervised Learning</h3>
              <p>In supervised learning, the model is trained on labeled data, where both input and desired output are provided. Common applications include:</p>
              <ul>
                <li>Image classification</li>
                <li>Spam detection</li>
                <li>Price prediction</li>
                <li>Medical diagnosis</li>
              </ul>

              <pre class="bg-gray-100 p-4 rounded-lg my-4"><code># Simple supervised learning example
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression

# Split data into training and testing sets
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

# Train the model
model = LogisticRegression()
model.fit(X_train, y_train)

# Make predictions
predictions = model.predict(X_test)</code></pre>

              <h3 id="unsupervised">Unsupervised Learning</h3>
              <p>Unsupervised learning works with unlabeled data, finding hidden patterns and structures. Key techniques include:</p>
              <div class="bg-green-50 p-4 rounded-lg my-4">
                <ul>
                  <li><strong>Clustering:</strong> Grouping similar data points (e.g., customer segmentation)</li>
                  <li><strong>Dimensionality Reduction:</strong> Reducing the number of features while preserving information</li>
                  <li><strong>Anomaly Detection:</strong> Identifying unusual patterns that don't conform to expected behavior</li>
                </ul>
              </div>

              <p class="text-sm text-gray-600 mt-6">💡 <strong>Pro Tip:</strong> Start with simple models and gradually increase complexity. Often, simpler models perform better and are easier to interpret.</p>
            </div>`
          }
        ],
        createdAt: '2025-01-10',
        updatedAt: '2025-01-11'
      }
    ]
  },
  {
    id: '2',
    name: 'Web Development',
    notes: [
      {
        id: 'note-2',
        title: 'Modern React Patterns',
        tableOfContents: [
          {
            id: 'react-hooks',
            title: 'React Hooks',
            level: 1,
            pageIndex: 0,
            children: [
              { id: 'usestate', title: 'useState Hook', level: 2, pageIndex: 0 },
              { id: 'useeffect', title: 'useEffect Hook', level: 2, pageIndex: 0 }
            ]
          }
        ],
        pages: [
          {
            id: 'page-3',
            title: 'React Hooks',
            content: `<div class="prose max-w-none">
              <h2 id="react-hooks">React Hooks</h2>
              <p>React Hooks are functions that let you use state and other React features in functional components. They were introduced in React 16.8 and have revolutionized how we write React applications.</p>

              <h3 id="usestate">useState Hook</h3>
              <p>The most commonly used hook for managing component state.</p>

              <pre class="bg-gray-100 p-4 rounded-lg my-4"><code>import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  return (
    &lt;div&gt;
      &lt;p&gt;Count: {count}&lt;/p&gt;
      &lt;button onClick={() => setCount(count + 1)}&gt;
        Increment
      &lt;/button&gt;
    &lt;/div&gt;
  );
}</code></pre>

              <h3 id="useeffect">useEffect Hook</h3>
              <p>Used for side effects in functional components, such as data fetching, subscriptions, or manually changing the DOM.</p>

              <div class="bg-yellow-50 p-4 rounded-lg my-4">
                <h4 class="font-semibold mb-2">⚠️ Important Rules:</h4>
                <ul>
                  <li>Only call hooks at the top level</li>
                  <li>Only call hooks from React functions</li>
                  <li>Use ESLint plugin for hooks to catch mistakes</li>
                </ul>
              </div>

              <pre class="bg-gray-100 p-4 rounded-lg my-4"><code>import { useState, useEffect } from 'react';

function DataFetcher() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then(data => setData(data));
  }, []); // Empty dependency array = run once

  return &lt;div&gt;{data ? data.title : 'Loading...'}&lt;/div&gt;;
}</code></pre>
            </div>`
          }
        ],
        createdAt: '2025-01-09',
        updatedAt: '2025-01-11'
      }
    ]
  },
  {
    id: '3',
    name: 'Quick Notes',
    notes: []
  }
]

// Create a global state for notes (simple approach for now)
let globalNotes: NoteCollection[] = [...mockNoteCollections]
let globalListeners: ((notes: NoteCollection[]) => void)[] = []

const notifyListeners = () => {
  globalListeners.forEach(listener => listener([...globalNotes]))
}

export function useNotes() {
  const [notes, setNotes] = useState<NoteCollection[]>([...globalNotes])

  useEffect(() => {
    // Add this component as a listener
    const listener = (newNotes: NoteCollection[]) => {
      setNotes(newNotes)
    }

    globalListeners.push(listener)

    return () => {
      // Remove this component from listeners on unmount
      globalListeners = globalListeners.filter(l => l !== listener)
    }
  }, [])

  const updateNotes = (newNotes: NoteCollection[]) => {
    globalNotes = [...newNotes]
    notifyListeners()
  }

  const addNote = (name: string) => {
    const newNote: NoteCollection = {
      id: Date.now().toString(),
      name: name || 'New Note',
      notes: []
    }
    updateNotes([...globalNotes, newNote])
    return newNote.id
  }

  const deleteNote = (noteId: string) => {
    updateNotes(globalNotes.filter(n => n.id !== noteId))
  }

  const updateNote = (noteId: string, updates: Partial<NoteCollection>) => {
    updateNotes(globalNotes.map(n =>
      n.id === noteId ? { ...n, ...updates } : n
    ))
  }

  return {
    notes,
    addNote,
    deleteNote,
    updateNote,
    getNote: (id: string) => globalNotes.find(n => n.id === id)
  }
}