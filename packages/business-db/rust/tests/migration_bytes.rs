//! The Tauri SQL plugin stores a checksum of each migration's exact bytes and
//! refuses to start ("migration N was previously applied but has been
//! modified") if they change. Line endings are pinned in `.gitattributes`;
//! this guards against a checkout or editor silently changing them.

use nexo_business_db::MIGRATIONS;

#[test]
fn migration_line_endings_match_what_devices_applied() {
    for m in MIGRATIONS {
        let crlf = m.sql.contains("\r\n");
        let bare_lf = m.sql.replace("\r\n", "").contains('\n');
        if m.version <= 5 {
            // First applied on pilot devices from a Windows (CRLF) checkout.
            assert!(crlf && !bare_lf, "migration {} must be CRLF only", m.version);
        } else {
            assert!(!crlf, "migration {} must be LF only", m.version);
        }
    }
}
