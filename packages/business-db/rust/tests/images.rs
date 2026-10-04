use nexo_business_db::apply_all_migrations;
use nexo_business_db::images::*;
use rusqlite::Connection;

fn db() -> Connection {
    let conn = Connection::open_in_memory().unwrap();
    apply_all_migrations(&conn).unwrap();
    conn.execute_batch(
        "INSERT INTO local_products (id,business_id,name,active,version,updated_at,image_url) VALUES
           ('a','biz','A',1,1,'t','https://x.test/a-300x300.webp'),
           ('b','biz','B',1,1,'t','https://x.test/b-300x300.webp'),
           ('c','biz','C',0,1,'t','https://x.test/c.webp'),
           ('d','biz','D',1,1,'t',NULL);",
    )
    .unwrap();
    conn
}

#[test]
fn lists_missing_photos_of_active_products_then_serves_cached_ones() {
    let conn = db();
    assert_eq!(missing_urls(&conn, "biz", 10).unwrap().len(), 2);
    store(&conn, "https://x.test/a-300x300.webp", "image/webp", &[1, 2, 3], "now").unwrap();
    assert_eq!(missing_urls(&conn, "biz", 10).unwrap(), vec!["https://x.test/b-300x300.webp".to_string()]);
    let all = load_all(&conn, "biz").unwrap();
    assert_eq!(all, vec![("https://x.test/a-300x300.webp".to_string(), "image/webp".to_string(), vec![1, 2, 3])]);
}

#[test]
fn rejects_non_images_and_prunes_unused_photos() {
    let conn = db();
    assert!(store(&conn, "http://x.test/a.webp", "image/webp", &[1], "now").is_err());
    assert!(store(&conn, "https://x.test/a-300x300.webp", "text/html", &[1], "now").is_err());
    assert!(store(&conn, "https://x.test/a-300x300.webp", "image/webp", &vec![0; MAX_IMAGE_BYTES + 1], "now").is_err());
    store(&conn, "https://x.test/old.webp", "image/webp", &[9], "now").unwrap();
    assert_eq!(prune(&conn).unwrap(), 1);
}
