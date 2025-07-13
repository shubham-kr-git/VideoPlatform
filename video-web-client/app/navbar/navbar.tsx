import Image from "next/image";
import styles from "./navbar.module.css";
import Link from "next/link";

export default function Navbar(){
    return (
        <nav className={styles.nav}>
            <Link href="/">
            <Image src="/globe.svg" alt="logo" width={24} height={24}/>
               
            </Link>
        </nav>
    );
} 