import { useEffect, useState } from "react";

export function useScrollPosition() {
	const [isScrolled, setIsScrolled] = useState(false);

	useEffect(() => {
		const handleScroll = () => {
			setIsScrolled(window.scrollY > 0);
		};

		// Set initial state
		handleScroll();

		window.addEventListener("scroll", handleScroll, { passive: true });
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	return { isScrolled };
}
