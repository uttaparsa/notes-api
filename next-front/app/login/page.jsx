import React from 'react'
import AuthLayout from '../components/AuthLayout'
import LoginFrom from '../components/LoginForm'

export default function page() {
    return (
        <AuthLayout>
            <LoginFrom />
        </AuthLayout>
    )
}
