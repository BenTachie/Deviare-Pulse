import { useMemo } from 'react'
import { Bar, Doughnut } from 'react-chartjs-2'
import StatCard from '../../components/ui/StatCard'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { useApp } from '../../context/AppContext'
import styles from './Reports.module.css'

const chartDefaults = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
}

const barOptions = {
  ...chartDefaults,
  scales: {
    x: { grid: { display: false }, ticks: { font: { size: 11 } } },
    y: { grid: { color: '#E8EDF5' }, ticks: { font: { size: 11 } } },
  },
}

const doughnutOptions = {
  ...chartDefaults,
  cutout: '68%',
  plugins: { legend: { display: false } },
}

export default function ReportsPage() {
  const { reportStats } = useApp()
  const { avgOsl, avgLvc, passRate, certYield, superActivePct, passivePct, scoreBuckets } = reportStats

  const scoreDistData = useMemo(() => ({
    labels: ['50–60', '60–70', '70–80', '80–90', '90–100'],
    datasets: [{
      label: 'Learners',
      data: scoreBuckets,
      backgroundColor: '#2D7DD2',
      borderRadius: 4,
    }],
  }), [scoreBuckets])

  const activityData = useMemo(() => ({
    labels: ['Super Active', 'Passive'],
    datasets: [{
      data: [superActivePct, passivePct],
      backgroundColor: ['#0B2545', '#2D7DD2'],
      borderWidth: 0,
    }],
  }), [superActivePct, passivePct])

  return (
    <div>
      {/* KPI Cards */}
      <div className={styles.statsGrid}>
        <StatCard
          label="Avg OSL Score"
          value={avgOsl}
          suffix="%"
          delta={avgOsl >= 85 ? 'Above 85% target' : 'Below 85% target'}
          deltaDir={avgOsl >= 85 ? 'up' : 'down'}
          accentColor="#2D7DD2"
        />
        <StatCard
          label="Avg LVC Attendance"
          value={avgLvc}
          suffix="%"
          delta={avgLvc >= 80 ? 'Above 80% target' : 'Below 80% target'}
          deltaDir={avgLvc >= 80 ? 'up' : 'down'}
          accentColor="#00C2CB"
        />
        <StatCard
          label="Assessment Pass Rate"
          value={passRate}
          suffix="%"
          delta={passRate >= 80 ? 'On track' : 'Needs attention'}
          deltaDir={passRate >= 80 ? 'up' : 'down'}
          accentColor="#0CA678"
        />
        <StatCard
          label="Certificate Yield"
          value={certYield}
          suffix="%"
          delta={certYield >= 70 ? 'On track' : 'Needs attention'}
          deltaDir={certYield >= 70 ? 'up' : 'down'}
          accentColor="#5B6EF7"
        />
      </div>

      {/* Charts */}
      <div className={styles.grid2}>
        <Card>
          <CardHeader title="Score Distribution" subtitle="Learner course score spread" />
          <CardBody>
            <div className={styles.chartWrap}>
              <Bar data={scoreDistData} options={barOptions} />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Activity Level Split" subtitle="Passive vs Super Active learners" />
          <CardBody>
            <div className={styles.chartWrap} style={{ height: 200 }}>
              <Doughnut data={activityData} options={doughnutOptions} />
            </div>
            <div className={styles.legend}>
              <span className={styles.legendItem}>
                <span className={styles.legendDot} style={{ background: '#0B2545' }} />
                Super Active {superActivePct}%
              </span>
              <span className={styles.legendItem}>
                <span className={styles.legendDot} style={{ background: '#2D7DD2' }} />
                Passive {passivePct}%
              </span>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Export */}
      <Card>
        <CardHeader
          title="Export Report"
          action={
            <div className={styles.exportActions}>
              <Button variant="secondary">Export PDF</Button>
              <Button variant="secondary">Export CSV</Button>
              <Button variant="primary">Email Report</Button>
            </div>
          }
        />
        <CardBody>
          <p className={styles.exportDesc}>
            Generate comprehensive learner progress reports for stakeholders,
            CSMs, and programme sponsors. Reports include milestone completion
            rates, certification yields, at-risk learner flags, and automation
            activity logs.
          </p>
        </CardBody>
      </Card>
    </div>
  )
}
