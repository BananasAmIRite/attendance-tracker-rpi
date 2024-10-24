import { CSSProperties, useEffect, useState } from 'react';

export interface CacheListProps<T> {
    getCache: () => Promise<T[]>;
    cacheToValues: (t: T) => string[];
    labels: string[];
    style?: CSSProperties | undefined;
}

// element that displays a list of any object array
export default function CacheList<T>(props: CacheListProps<T>) {
    // cache of the data to be displayed
    const [cache, setCache] = useState<T[]>([]);

    // retrieve the cache on start
    useEffect(() => {
        props.getCache().then(setCache);
    }, []);

    return (
        <div style={{ height: '60%', display: 'flex', flexDirection: 'column', ...props.style }}>
            <div style={{ flexShrink: '1' }}>
                <CacheListRow values={props.labels} gray={false} />
            </div>
            <div
                style={{
                    flexGrow: 100,
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'auto',
                    height: '90%',
                }}
            >
                {cache.map((e, i) => (
                    <CacheListRow values={props.cacheToValues(e)} key={i} gray={i % 2 === 0} />
                ))}
            </div>
        </div>
    );
}

function CacheListRow(props: { values: string[]; gray: boolean }) {
    return (
        <div style={{ display: 'flex', flex: 1, alignSelf: 'stretch', flexDirection: 'row' }}>
            {props.values.map((e, i) => (
                <div
                    style={{
                        flex: 1,
                        alignSelf: 'stretch',
                        flexDirection: 'row',
                        backgroundColor: props.gray ? 'lightgray' : 'white',
                    }}
                    key={i}
                >
                    <span>{e}</span>
                </div>
            ))}
        </div>
    );
}
