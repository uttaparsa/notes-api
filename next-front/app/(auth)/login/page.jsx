import React from "react";
import LoginFrom from "../../components/auth/LoginForm";
import Link from 'next/link';

export default function page() {
    return (
        <>
            <LoginFrom />
            <div className="text-center">
                <Link href="/signup" className="text-decoration-none">
                    Don&apos;t have an account? Sign up
                </Link>
            </div>
        </>
    );
}
