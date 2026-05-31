const routes = {
  "/admin": {
    title: "IVhome Admin",
    description: "Заготовка маршрута для сотрудников платформы.",
  },
  "/clinic": {
    title: "IVhome Clinic",
    description: "Заготовка маршрута для уполномоченных сотрудников партнёра.",
  },
} as const;

export function App() {
  const route = routes[window.location.pathname as keyof typeof routes];

  if (!route) {
    return (
      <main>
        <h1>IVhome Internal Dashboard</h1>
        <p>В MVP используется одно приложение с role-based маршрутами.</p>
        <ul>
          <li>
            <a href="/admin">/admin</a>
          </li>
          <li>
            <a href="/clinic">/clinic</a>
          </li>
        </ul>
      </main>
    );
  }

  return (
    <main>
      <h1>{route.title}</h1>
      <p>{route.description}</p>
      <p>Функциональность dashboard будет добавлена поэтапно.</p>
    </main>
  );
}
