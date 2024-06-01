<script lang="ts" setup>
onMounted(() => {
    document.body.style.overflow = 'auto';
});
</script>

<template>
    <div class="landing max-w-screen-lg mx-auto">
        <div id="home" class="navbar bg-base-100">
            <div class="flex-1">
                <img :src="'/logo-icon.png'" width="72" height="72" alt="OpenNotas Logo">
            </div>
        </div>

        <!-- Terms of Use -->
        <div id="terms">
            <h2 class="mb-5 mt-5 text-3xl font-bold text-base-content">
                TERMS OF SERVICE
                <a class="text-3xl underline" href="#terms">#</a>
            </h2>
            <p class="py-2">
                Hello and thank you for using our note-taking application. Before using it, please read carefully the
                Terms of Service (hereinafter referred to as "Terms") below. By using our note-taking application, you
                agree to comply with and be bound by these Terms.
            </p>

            <h3 class="text-xl font-bold mt-4">
                Introduction
            </h3>

            <ul class="list-disc pl-8">
                <li>
                    <p class="py-2">
                        We provide you with a note-taking application that allows you to create, edit, and manage your
                        personal notes (hereinafter referred to as "Service").
                    </p>
                </li>
            </ul>

            <h3 class="text-xl font-bold mt-4">
                User Ownership and Responsibility
            </h3>

            <ul class="list-disc pl-8">
                <li>
                    <p class="py-2">You are the sole owner of the notes you create and manage in the application.</p>
                </li>
                <li>
                    <p class="py-2">We are not responsible for any of your notes.</p>
                </li>
            </ul>

            <h3 class="text-xl font-bold mt-4">
                Service Provision Responsibility
            </h3>

            <ul class="list-disc pl-8">
                <li>
                    <p class="py-2">We are obliged to provide the note-taking application as advertised and support you
                        during the use of the Service.
                    </p>
                </li>
                <li>
                    <p class="py-2">
                        We are not responsible for any loss of user data due to user error or errors from third-party
                        integrated libraries.
                    </p>
                </li>
            </ul>

            <h3 class="text-xl font-bold mt-4">
                Data Backup
            </h3>

            <ul class="list-disc pl-8">
                <li>
                    <p class="py-2">
                        We provide built-in data backup solutions to assist users in protecting and restoring their
                        data.
                        However, ensuring successful and accurate backups remains the user's responsibility.
                    </p>
                </li>
            </ul>

            <h3 class="text-xl font-bold mt-4">
                Limitation of Liability
            </h3>

            <ul class="list-disc pl-8">
                <li>
                    <p class="py-2">
                        We do not guarantee that the Service will be uninterrupted or error-free. All responsibilities
                        for using the Service, including but not limited to data loss, lie with the user.
                    </p>
                </li>
                <li>
                    <p class="py-2">
                        We are not responsible for any damages, direct or indirect, arising from the use or inability to
                        use the Service.
                    </p>
                </li>
            </ul>

            <h3 class="text-xl font-bold mt-4">General Terms</h3>

            <ul class="list-disc pl-8">
                <li>
                    <p class="py-2">
                        We reserve the right to amend these Terms at any time and will notify you via email or in-app
                        notifications. Continuing to use the Service after any changes indicates your acceptance of
                        those
                        changes.
                    </p>
                </li>
                <li>
                    <p class="py-2">
                        If you do not agree with the changes, you may stop using the Service and delete your account.
                    </p>
                </li>
            </ul>

            <h3 class="text-xl font-bold mt-4">
                Governing Law
            </h3>

            <ul class="list-disc pl-8">
                <li>
                    <p class="py-2">
                        These Terms are governed and interpreted according to the current laws of the country where you
                        reside or have your headquarters.
                    </p>
                </li>
            </ul>

            <p class="py-2">
                If you have any questions about these Terms, please contact us via email or through the support section
                in the application.
            </p>

            <p class="py-2">
                We thank you for using the Service and hope you have a great experience with our note-taking
                application.
            </p>

            <p class="py-2">
                These terms are designed to protect both parties and ensure a safe and transparent environment for using
                the application. If you have any additional requests or changes, please let us know.
            </p>
        </div>

        <!-- Privacy Policy -->
        <div class="mt-10" id="privacy-policy">
            <h2 class="mb-5 mt-5 text-3xl font-bold text-base-content">
                PRIVACY POLICY
                <a class="text-3xl underline" href="#privacy-policy">#</a>
            </h2>
            <p class="py-2">
                We are committed to protecting your privacy. This Privacy Policy explains how we handle your information
                when you use our note-taking application. By using the application, you agree to the terms of this
                policy.
            </p>

            <h3 class="text-xl font-bold mt-4">
                Information Collection and Use
            </h3>

            <ul class="list-disc pl-8">
                <li>
                    <p class="py-2">
                        Note Data: We do not store or access any of your note data. All your notes are stored locally on
                        your device, and we do not have access to them.
                    </p>
                </li>
                <li>
                    <p class="py-2">
                        Distribution via Website: When you use the version of the application distributed through our
                        website, the application may integrate tracking tools such as Google Analytics (GA) to collect
                        information about how you use the application to optimize the user experience. This information
                        only includes anonymous data such as the number of visits, usage time, and common actions within
                        the application, and does not include any personal data or note content.
                    </p>
                </li>

                <li>
                    <p class="py-2">
                        Built from Source: If you create a build from our source code, the application will not
                        integrate
                        any tracking tools. You have full control and know that no information is sent out.
                    </p>
                </li>
            </ul>

            <h3 class="text-xl font-bold mt-4">
                Security
            </h3>

            <ul class="list-disc pl-8">
                <li>
                    <p class="py-2">
                        We are committed to protecting any information you provide. Although we do not collect personal
                        information from your notes, we ensure that any other information, such as anonymous usage data
                        from the web version, is secured and used only to improve the application.
                    </p>
                </li>
            </ul>

            <h3 class="text-xl font-bold mt-4">
                Your Rights
            </h3>

            <ul class="list-disc pl-8">
                <li>
                    <p class="py-2">
                        You have the right to access and control all your note data.
                    </p>
                </li>
                <li>
                    <p class="py-2">
                        You have the right to choose to use a version of the application that does not integrate any
                        tracking tools by creating a build from the source code.
                    </p>
                </li>
            </ul>

            <h3 class="text-xl font-bold mt-4">
                Information Sharing
            </h3>

            <ul class="list-disc pl-8">
                <li>
                    <p class="py-2">
                        We do not share any of your personal information or note content with third parties.
                    </p>
                </li>
                <li>
                    <p class="py-2">
                        Anonymous information collected from the web-distributed version is used internally only to
                        analyze and improve the application.
                    </p>
                </li>
            </ul>

            <h3 class="text-xl font-bold mt-4">
                Changes to Privacy Policy
            </h3>

            <ul class="list-disc pl-8">
                <li>
                    <p class="py-2">
                        We may update this Privacy Policy from time to time. Any changes will be notified to you via
                        email
                        or in-app notifications. Continuing to use the application after any changes indicates your
                        acceptance of those changes.
                    </p>
                </li>
            </ul>

            <h3 class="text-xl font-bold mt-4">
                Contact
            </h3>

            <ul class="list-disc pl-8">
                <li>
                    <p class="py-2">
                        If you have any questions or requests regarding this Privacy Policy, please contact us via email
                        or through the support section in the application.
                    </p>
                </li>
            </ul>

            We are committed to protecting your privacy and securing your information while using our note-taking
            application. Thank you for trusting and using our service.
        </div>

        <!-- Cookie Policy -->
        <div class="mt-10" id="cookie-policy">
            <h2 class="mb-5 mt

-5 text-3xl font-bold text-base-content">
                COOKIE POLICY
                <a class="text-3xl underline" href="#cookie-policy">#</a>
            </h2>
            <p class="py-2">
                This Cookie Policy explains how we use cookies and similar technologies when you use our note-taking
                application. By continuing to use the application, you agree to our use of cookies as described in this
                policy.
            </p>

            <h3 class="text-xl font-bold mt-4">
                What Are Cookies?
            </h3>

            <ul class="list-disc pl-8">
                <li>
                    <p class="py-2">
                        Cookies are small text files that are stored on your device when you visit a website. They help
                        us
                        understand how you use our application and how we can improve it.
                    </p>
                </li>
            </ul>

            <h3 class="text-xl font-bold mt-4">
                How We Use Cookies
            </h3>

            <ul class="list-disc pl-8">
                <li>
                    <p class="py-2">
                        We use cookies to analyze user behavior, optimize the user experience, and remember your
                        preferences.
                    </p>
                </li>
            </ul>

            <h3 class="text-xl font-bold mt-4">
                Types of Cookies We Use
            </h3>

            <ul class="list-disc pl-8">
                <li>
                    <p class="py-2">
                        Essential Cookies: These cookies are necessary for the application to function properly. Without
                        these cookies, the application may not be fully functional.
                    </p>
                </li>
                <li>
                    <p class="py-2">
                        Analytics Cookies: These cookies help us understand how you interact with the application, such
                        as
                        which pages you visit, so we can improve our service.
                    </p>
                </li>
            </ul>

            <h3 class="text-xl font-bold mt-4">
                Managing Cookies
            </h3>

            <ul class="list-disc pl-8">
                <li>
                    <p class="py-2">
                        You can manage your cookie preferences through your browser settings. Most browsers allow you to
                        refuse cookies or delete cookies that have already been set.
                    </p>
                </li>
            </ul>

            <h3 class="text-xl font-bold mt-4">
                Changes to Cookie Policy
            </h3>

            <ul class="list-disc pl-8">
                <li>
                    <p class="py-2">
                        We may update this Cookie Policy from time to time. Any changes will be notified to you via
                        email
                        or in-app notifications. Continuing to use the application after any changes indicates your
                        acceptance of those changes.
                    </p>
                </li>
            </ul>

            <h3 class="text-xl font-bold mt-4">
                Contact
            </h3>

            <ul class="list-disc pl-8">
                <li>
                    <p class="py-2">
                        If you have any questions or requests regarding this Cookie Policy, please contact us via email
                        or
                        through the support section in the application.
                    </p>
                </li>
            </ul>

            Thank you for using our note-taking application and for your understanding and cooperation regarding our use
            of cookies.
        </div>

        <div class="h-32"></div>
    </div>
</template>
