import styles from '../login/AuthLayout.module.css';
import 'bootstrap/dist/css/bootstrap.min.css'
import BootstrapClient from '../../components/BootstrapClient'

export const metadata = {
  title: 'Sign Up',
  description: 'Create your account',
}

export default function SignupLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className={`d-flex min-vh-100 justify-content-center align-items-center ${styles.rootDiv}`}>
          <div className={`min-vh-100 min-vw-100 ${styles.background1}`}></div>
          <div className="card shadow-sm">
            <div className={`card-body ${styles.authCard}`}>
              <div className="d-flex justify-content-center">
                <div className="p-4">
                  {children}
                </div>
              </div>
            </div>
          </div>
        </div>
        <BootstrapClient />
      </body>
    </html>
  )
}
