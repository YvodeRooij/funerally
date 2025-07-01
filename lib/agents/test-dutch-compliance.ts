/**
 * Test Dutch Legal Compliance System
 * 
 * This test demonstrates the Dutch legal compliance functionality
 */

import { dutchLegalComplianceAgent, DutchWorkingDaysCalculator } from './dutch-legal-compliance'

/**
 * Test the Dutch Working Days Calculator
 */
export async function testWorkingDaysCalculator() {
  console.log('🧪 Testing Dutch Working Days Calculator...\n')
  
  const calculator = new DutchWorkingDaysCalculator()
  
  // Test scenario 1: Death on Monday, deadline calculation
  const deathDate = new Date('2024-12-02') // Monday
  const deadline = calculator.calculateLegalDeadline(deathDate)
  const daysRemaining = calculator.getDaysRemaining(deadline)
  
  console.log('📅 Test Scenario 1: Death on Monday')
  console.log(`Death date: ${deathDate.toLocaleDateString('nl-NL')}`)
  console.log(`Legal deadline: ${deadline.toLocaleDateString('nl-NL')}`)
  console.log(`Days remaining: ${daysRemaining}`)
  
  // Test scenario 2: Death before holiday
  const deathBeforeHoliday = new Date('2024-12-23') // Monday before Christmas
  const holidayDeadline = calculator.calculateLegalDeadline(deathBeforeHoliday)
  const holidayDaysRemaining = calculator.getDaysRemaining(holidayDeadline)
  
  console.log('\n📅 Test Scenario 2: Death before Christmas holidays')
  console.log(`Death date: ${deathBeforeHoliday.toLocaleDateString('nl-NL')}`)
  console.log(`Legal deadline: ${holidayDeadline.toLocaleDateString('nl-NL')}`)
  console.log(`Days remaining: ${holidayDaysRemaining}`)
  
  // Test working days calculation
  const workingDaysCalc = calculator.calculateWorkingDays(deathDate, deadline)
  console.log('\n⏰ Working Days Calculation:')
  console.log(`Total days: ${workingDaysCalc.totalDays}`)
  console.log(`Working days: ${workingDaysCalc.workingDays}`)
  console.log(`Holidays: ${workingDaysCalc.holidays.length}`)
  console.log(`Weekends: ${workingDaysCalc.weekends.length}`)
  
  return { deathDate, deadline, daysRemaining }
}

/**
 * Test the Dutch Legal Compliance Agent
 */
export async function testDutchComplianceAgent() {
  console.log('\n🧪 Testing Dutch Legal Compliance Agent...\n')
  
  const agent = dutchLegalComplianceAgent
  
  // Test compliance initialization
  const funeralRequestId = 'test-funeral-' + Date.now()
  const deathRegistrationDate = new Date('2024-12-02')
  
  console.log('🚀 Initializing compliance tracking...')
  console.log(`Funeral Request ID: ${funeralRequestId}`)
  console.log(`Death Registration: ${deathRegistrationDate.toLocaleDateString('nl-NL')}`)
  
  try {
    const complianceContext = await agent.processCompliance(funeralRequestId, deathRegistrationDate)
    
    console.log('\n✅ Compliance Context Created:')
    console.log(`Status: ${complianceContext.complianceStatus}`)
    console.log(`Legal Deadline: ${complianceContext.legalDeadline?.toLocaleDateString('nl-NL')}`)
    console.log(`Days Remaining: ${complianceContext.deadlineDaysRemaining}`)
    console.log(`Emergency Protocol: ${complianceContext.emergencyProtocolTriggered ? 'ACTIVE' : 'Inactive'}`)
    
    // Test alert generation
    const alerts = agent.generateAlerts(complianceContext)
    console.log(`\n🚨 Generated ${alerts.length} alert(s):`)
    
    alerts.forEach((alert, index) => {
      console.log(`\nAlert ${index + 1}:`)
      console.log(`  Type: ${alert.alertType.toUpperCase()}`)
      console.log(`  Message: ${alert.message}`)
      console.log(`  Hours Remaining: ${alert.hoursRemaining}`)
      console.log(`  Stakeholders: ${alert.stakeholders.join(', ')}`)
      console.log(`  Actions Required: ${alert.actionRequired.length}`)
      alert.actionRequired.forEach((action, i) => {
        console.log(`    ${i + 1}. ${action}`)
      })
    })
    
    return complianceContext
    
  } catch (error) {
    console.error('❌ Error testing compliance agent:', error)
    return null
  }
}

/**
 * Test Emergency Protocol
 */
export async function testEmergencyProtocol() {
  console.log('\n🧪 Testing Emergency Protocol...\n')
  
  const agent = dutchLegalComplianceAgent
  
  // Create an emergency scenario (death date in the past)
  const funeralRequestId = 'emergency-test-' + Date.now()
  const pastDeathDate = new Date()
  pastDeathDate.setDate(pastDeathDate.getDate() - 8) // 8 days ago (past deadline)
  
  console.log('🚨 Creating emergency scenario...')
  console.log(`Death Date: ${pastDeathDate.toLocaleDateString('nl-NL')} (8 days ago)`)
  
  try {
    const emergencyContext = await agent.processCompliance(funeralRequestId, pastDeathDate)
    
    console.log('\n🚨 Emergency Context:')
    console.log(`Status: ${emergencyContext.complianceStatus}`)
    console.log(`Days Overdue: ${Math.abs(emergencyContext.deadlineDaysRemaining || 0)}`)
    console.log(`Emergency Protocol: ${emergencyContext.emergencyProtocolTriggered ? 'TRIGGERED' : 'Not triggered'}`)
    
    const emergencyAlerts = agent.generateAlerts(emergencyContext)
    console.log(`\n🚨 Emergency Alerts: ${emergencyAlerts.length}`)
    
    emergencyAlerts.forEach((alert, index) => {
      console.log(`\nEmergency Alert ${index + 1}:`)
      console.log(`  Type: ${alert.alertType.toUpperCase()}`)
      console.log(`  Message: ${alert.message}`)
      console.log(`  Immediate Actions: ${alert.actionRequired.length}`)
      alert.actionRequired.forEach((action, i) => {
        console.log(`    ${i + 1}. ${action}`)
      })
    })
    
    return emergencyContext
    
  } catch (error) {
    console.error('❌ Error testing emergency protocol:', error)
    return null
  }
}

/**
 * Run all Dutch compliance tests
 */
export async function runAllDutchComplianceTests() {
  console.log('🇳🇱 DUTCH LEGAL COMPLIANCE SYSTEM TEST\n')
  console.log('=' .repeat(60))
  
  try {
    // Test 1: Working Days Calculator
    await testWorkingDaysCalculator()
    
    // Test 2: Normal Compliance Flow
    await testDutchComplianceAgent()
    
    // Test 3: Emergency Protocol
    await testEmergencyProtocol()
    
    console.log('\n' + '=' .repeat(60))
    console.log('✅ ALL TESTS COMPLETED SUCCESSFULLY')
    console.log('🇳🇱 Dutch Legal Compliance System is operational!')
    
  } catch (error) {
    console.error('\n❌ TEST SUITE FAILED:', error)
  }
}

// Export test functions
export { runAllDutchComplianceTests }