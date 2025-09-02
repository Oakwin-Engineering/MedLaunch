<svelte:head>
	<title>MedLaunch Admin</title>
</svelte:head>

<div class="admin-container">
	<header class="admin-header">
		<h1>MedLaunch</h1>
		<p>Admin Dashboard</p>
	</header>

	<main class="button-container">
		<a href="/uhealth" class="dashboard-button uhealth">UHealth Dashboard</a>
		<a href="/demo" class="dashboard-button demo">Demo Dashboard</a>
		<a href="/vitalcare" class="dashboard-button vitalcare">VitalCare Dashboard</a>
	</main>
</div>

<style>
	:global(body) {
		background-color: #f0f4f8;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
			Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
		margin: 0;
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 100vh;
	}

	.admin-container {
		text-align: center;
		background-color: white;
		padding: 3rem 4rem;
		border-radius: 12px;
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
	}

	.admin-header h1 {
		font-size: 2.5rem;
		color: #1e3a8a; /* A deep blue */
		margin-bottom: 0.5rem;
	}

	.admin-header p {
		font-size: 1.1rem;
		color: #64748b; /* A cool gray */
		margin-top: 0;
	}

	.button-container {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-top: 2.5rem;
	}

	.dashboard-button {
		display: block;
		padding: 0.9rem 1.5rem;
		border-radius: 8px;
		text-decoration: none;
		font-weight: 600;
		font-size: 1rem;
		color: white;
		transition: all 0.3s ease;
		min-width: 250px;
	}

	.dashboard-button:hover {
		transform: translateY(-3px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	.uhealth {
		background-color: #2563eb; /* Blue */
	}

	.demo {
		background-color: #16a34a; /* Green */
	}

	.vitalcare {
		background-color: #c026d3; /* Fuchsia */
	}
</style>