"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Users, MessageSquare, FileText, ArrowRight, Plus } from "lucide-react"
import { DutchLegalComplianceWidget } from "@/components/director/compliance-overview-widget"
import { NewClientInvitationModal } from "@/components/director/new-client-invitation-modal"
import { PendingInvitationsWidget } from "@/components/director/pending-invitations-widget"
import Link from "next/link"

export function DirectorDashboard() {
  const [isInvitationModalOpen, setIsInvitationModalOpen] = useState(false)

  // Mock director data - in production, get from auth context
  const directorInfo = {
    id: "dir-001",
    name: "Jan van der Berg"
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Overzicht van uw uitvaartdiensten</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="rounded-xl px-4" asChild>
            <Link href="/director/clients">
              <Users className="h-4 w-4 mr-2" />
              Cliënten
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
          <Button 
            onClick={() => setIsInvitationModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nieuwe klant
          </Button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        {/* Primary Column - Deadlines */}
        <div className="xl:col-span-1">
          <DutchLegalComplianceWidget />
        </div>

        {/* Secondary Column - Quick Stats */}
        <div className="xl:col-span-2">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <div className="text-2xl font-semibold text-gray-900 mb-1">2</div>
              <div className="text-sm text-gray-500">Verbonden families</div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <div className="text-2xl font-semibold text-gray-900 mb-1">1</div>
              <div className="text-sm text-gray-500">Urgent vandaag</div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-purple-600" />
                </div>
              </div>
              <div className="text-2xl font-semibold text-gray-900 mb-1">1</div>
              <div className="text-sm text-gray-500">Nieuw rapport</div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                  <FileText className="w-5 h-5 text-orange-600" />
                </div>
              </div>
              <div className="text-2xl font-semibold text-gray-900 mb-1">1</div>
              <div className="text-sm text-gray-500">Wacht op intake</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Invitations */}
        <div className="lg:col-span-1">
          <PendingInvitationsWidget 
            directorId={directorInfo.id}
            onInvitationUpdate={() => {
              // Refresh dashboard data when invitations update
              console.log('Invitations updated')
            }}
          />
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-full">
            <div className="px-6 py-5 border-b border-gray-50">
              <h3 className="text-lg font-semibold text-gray-900">Recente activiteit</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center space-x-4 py-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Familie van der Berg</p>
                  <p className="text-xs text-gray-500">Intake rapport voltooid • Deadline vandaag</p>
                </div>
                <p className="text-xs text-gray-400">3u geleden</p>
              </div>
              <div className="flex items-center space-x-4 py-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Familie Jansen</p>
                  <p className="text-xs text-gray-500">Verbonden via code UFV-2025-123456</p>
                </div>
                <p className="text-xs text-gray-400">1 dag geleden</p>
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Appointments */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-full">
            <div className="px-6 py-5 border-b border-gray-50">
              <h3 className="text-lg font-semibold text-gray-900">Komende afspraken</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center space-x-4 py-3">
                <div className="text-sm font-medium text-gray-900 w-12">14:00</div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Familie van der Berg</p>
                  <p className="text-xs text-gray-500">Urgente planning • Amsterdam</p>
                </div>
              </div>
              <div className="flex items-center space-x-4 py-3">
                <div className="text-sm font-medium text-gray-900 w-12">16:30</div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Familie Jansen</p>
                  <p className="text-xs text-gray-500">Intake begeleiding • Rotterdam</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* New Client Invitation Modal */}
      <NewClientInvitationModal
        isOpen={isInvitationModalOpen}
        onClose={() => setIsInvitationModalOpen(false)}
        directorId={directorInfo.id}
        directorName={directorInfo.name}
      />
    </div>
  )
}
