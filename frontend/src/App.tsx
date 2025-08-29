import { Layout } from '@/components/layout/Layout'
import { Agents } from '@/pages/Agents'
import { Analysis } from '@/pages/Analysis'
import { Dashboard } from '@/pages/Dashboard'
import { DocumentDetail } from '@/pages/DocumentDetail'
import { Documents } from '@/pages/Documents'
import { Search } from '@/pages/Search'
import { Upload } from '@/pages/Upload'
import { Route, Routes } from 'react-router-dom'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/documents/:id" element={<DocumentDetail />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/analysis" element={<Analysis />} />
        <Route path="/search" element={<Search />} />
        <Route path="/agents" element={<Agents />} />
      </Routes>
    </Layout>
  )
}

export default App