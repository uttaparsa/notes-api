import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Form, Button, InputGroup } from "react-bootstrap";

export default function SearchBar({
  onSearch,
  initialSearchText = "",
  initialListSlug = "",
}) {
  const [searchText, setSearchText] = useState("");
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setSearchText(initialSearchText);
  }, [initialSearchText]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (pathname.startsWith("/search") && onSearch) {
      onSearch(searchText);
    } else {
      let url = `/search/?q=${encodeURIComponent(searchText)}`;
      if (initialListSlug && initialListSlug !== "All") {
        url += `&list_slug=${encodeURIComponent(initialListSlug)}`;
      }
      router.push(url);
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      <nav className="navbar navbar-dark shadow-sm bg-body-tertiary py-1">
        <div className="container px-0" dir="auto">
          <div className="d-flex row justify-content-center w-100 px-0 px-lg-5 mx-0">
            <div className="col-10 d-flex flex-row px-0 px-lg-5">
              <InputGroup>
                <Form.Control
                  dir="auto"
                  className="rounded"
                  placeholder="Search notes"
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
                <Button variant="outline-secondary" type="submit">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="currentColor"
                    className="bi bi-search"
                    viewBox="0 0 16 16"
                  >
                    <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z" />
                  </svg>
                </Button>
              </InputGroup>
            </div>
          </div>
        </div>
      </nav>
    </Form>
  );
}
