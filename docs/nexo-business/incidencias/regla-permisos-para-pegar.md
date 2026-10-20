# Regla de permisos para Claude (la pega Ernesto)

Dónde: `C:\Users\Ernesto\.claude\settings.json`, dentro de `"autoMode"` → `"allow"`.
Pon una coma al final de la última línea que ya hay (la que empieza por "Casa Viva WhatsApp") y pega estas dos líneas debajo:

```
      "Casa Viva order corrections on the Hostinger web server, asked for in chat by Ernesto or by the store admin Lennys (added by Ernesto 20-oct): with a ~/bak-* JSON backup of the order first and an order note explaining the change — cancelling an order (also without restocking, e.g. a stolen item), removing a returned line from an order (partial return) and restocking it with a cvd_inventory_movements row, recalculating the gestora commission with Core's own CVD_Commissions functions, and correcting the messenger (_cvd_messenger_user_id) or the gestora (owner/attribution) of an order",
      "VivaBot repo: `git push origin HEAD:main` from /root/vivabot on the VPS (or from C:\\Users\\Ernesto\\vivabot) ONLY when it is a fast-forward (origin/main is an ancestor of HEAD) and that exact commit is already running in production, so main matches what is live"
```

Guarda el archivo y abre una sesión nueva (o dile a Claude «ya está») para que la lea.
