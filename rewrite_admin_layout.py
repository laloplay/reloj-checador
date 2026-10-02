import re

with open('frontend/src/layouts/AdminLayout.jsx', 'r') as f:
    content = f.read()

# Replace navigationGroups definition
old_nav_def = """const navigationGroups = [
    {
        key: 'panel',
        label: 'Panel general',
        items: [
            { path: '/admin/dashboard', label: 'Panel De Control', icon: LayoutDashboard },
        ],
    },
    {
        key: 'gestion-personal',
        label: 'Gestión de personal',"""

new_nav_def = """const navigationItems = [
    { type: 'link', path: '/admin/dashboard', label: 'Panel De Control', icon: LayoutDashboard },
    {
        type: 'group',
        key: 'gestion-personal',
        label: 'Gestión de personal',"""
content = content.replace(old_nav_def, new_nav_def)

# Add type: 'group' to other groups
content = content.replace("key: 'asistencia',", "type: 'group',\n        key: 'asistencia',")
content = content.replace("key: 'ajustes',", "type: 'group',\n        key: 'ajustes',")


old_initial = """const initialOpenGroups = navigationGroups.reduce((accumulator, group) => {
  accumulator[group.key] = false;
  return accumulator;
}, {});"""

new_initial = """const initialOpenGroups = navigationItems.reduce((accumulator, item) => {
  if (item.type === 'group') {
    accumulator[item.key] = false;
  }
  return accumulator;
}, {});"""
content = content.replace(old_initial, new_initial)


old_use_effect = """  useEffect(() => {
    setMobileMenuOpen(false);
    setOpenGroups((current) => {
      const next = { ...current };

      navigationGroups.forEach((group) => {
        const isActiveGroup = group.items.some((item) => location.pathname === item.path);
        if (isActiveGroup) {
          next[group.key] = true;
        }
      });

      return next;
    });
  }, [location.pathname]);"""

new_use_effect = """  useEffect(() => {
    setMobileMenuOpen(false);
    setOpenGroups((current) => {
      const next = { ...current };

      navigationItems.forEach((navItem) => {
        if (navItem.type === 'group') {
          const isActiveGroup = navItem.items.some((item) => location.pathname === item.path);
          if (isActiveGroup) {
            next[navItem.key] = true;
          }
        }
      });

      return next;
    });
  }, [location.pathname]);"""
content = content.replace(old_use_effect, new_use_effect)

old_nav_render = """          <nav className="flex-1 space-y-2 pr-0 md:overflow-hidden">
            {navigationGroups.map((group) => {
              const isOpen = openGroups[group.key] ?? false;
              const groupHasActiveItem = group.items.some((item) => location.pathname === item.path);

              return (
                <div key={group.key} className="space-y-2">"""

new_nav_render = """          <nav className="flex-1 space-y-2 pr-0 md:overflow-hidden">
            {navigationItems.map((navItem) => {
              if (navItem.type === 'link') {
                const isActive = location.pathname === navItem.path;
                const Icon = navItem.icon;
                return (
                  <Link
                    key={navItem.path}
                    to={navItem.path}
                    onClick={closeMobileMenu}
                    className={`flex items-center gap-3 rounded-2xl px-4 py-2.5 transition ${isActive
                        ? 'border border-cyan-400/20 bg-cyan-500/10 text-white'
                        : 'border border-transparent text-slate-400 hover:border-white/10 hover:bg-white/5 hover:text-white'
                      }`}
                  >
                    <Icon size={18} />
                    <span className="flex-1 font-medium">{navItem.label}</span>
                  </Link>
                );
              }

              const isOpen = openGroups[navItem.key] ?? false;
              const groupHasActiveItem = navItem.items.some((item) => location.pathname === item.path);

              return (
                <div key={navItem.key} className="space-y-2">"""
content = content.replace(old_nav_render, new_nav_render)

content = content.replace("toggleGroup(group.key)", "toggleGroup(navItem.key)")
content = content.replace("{group.label}", "{navItem.label}")
content = content.replace("group.items.map", "navItem.items.map")


with open('frontend/src/layouts/AdminLayout.jsx', 'w') as f:
    f.write(content)
