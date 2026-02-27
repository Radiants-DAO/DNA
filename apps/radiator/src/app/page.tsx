import Link from 'next/link'

export default function () {
  return (<>
    <h1>HOME</h1>
    <Link href="/setup">
      Setup a Radiator
    </Link>
  </>
  );
}
