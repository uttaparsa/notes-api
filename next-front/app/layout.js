"use client"
import { createContext } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css'
import './globals.css'
import { Inter } from 'next/font/google'
import BootstrapClient from './components/BootstrapClient'
import TopNavbar from './components/TopNavbar'

const inter = Inter({ subsets: ['latin'] })

export const NoteListContext = createContext([]);


export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
      <TopNavbar></TopNavbar>
         <div class="bg-dark h-100" style={{minHeight: '100vh'}}>

        {children}
        <BootstrapClient />
        </div>
      </body>
    </html>
  )
}

