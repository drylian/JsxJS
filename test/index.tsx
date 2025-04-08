import { writeFileSync } from "fs";
import { ClientLibs, DOM, InjectContext, Link, Router, Routes } from "../src";
const Application = async () => {
    const mockUser = {
        name: "Drylian",
        email: "daniel.alternight@gmail.com"
    }
    return await DOM.renderToString(<html>
        <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
            <ClientLibs />
            <InjectContext id="user" context={mockUser} />
        </head>
        <body>
            <Routes>
                <Router path="/">
                    <h3> Hello mother fucker</h3>
                    <Link href="/a">go 2</Link>
                </Router>
                <Router path="/a">
                    <h3> Hello mother fucker2</h3>
                </Router>
            </Routes>
        </body>
    </html>)
};

(async () => {
    writeFileSync("./index.html", "<!doctype html>" + await Application());
    console.log("gerated")
})();