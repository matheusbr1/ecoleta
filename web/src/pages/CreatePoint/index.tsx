import React, { useEffect, useState, ChangeEvent, FormEvent } from 'react'
import { Link, useHistory } from 'react-router-dom'
import { FiArrowLeft } from 'react-icons/fi'
import { Map, TileLayer, Marker } from 'react-leaflet'
import axios from 'axios'
import { LeafletMouseEvent } from 'leaflet'

import api from '../../services/api'
import './styles.css'
import Logo from '../../assets/logo.svg'

interface Item {
    id: number;
    title: String;
    image_url: string;
}


interface IBGEUFresponse {
    sigla: string;
}

interface IBGEcityresponse {
    nome: string;
}

const CreatePoint = () => {

    // Armazenar infos
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        whatsapp: ''
    })

    const [items, setItems] = useState<Item[]>([])
    const [UFs, setUFs] = useState<string[]>([])
    const [selectedUf, setselectedUf] = useState('0')
    const [cities, setCities] = useState<string[]>([])
    const [selectedCity, setselectedCity] = useState('0')
    const [initialPosition, setinitialPosition] = useState<[number, number]>([0, 0])
    const [selectedPosition, setSelectedPosition] = useState<[number, number]>([0, 0])
    const [selectedItems, setSelectedItems] = useState<number[]>([])

    const history = useHistory()

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(position => {
            const { latitude, longitude } = position.coords
            setinitialPosition([latitude, longitude])
        })
    }, [])

    // Load Api with useEffect
    useEffect(() => {
        api.get('/items').then(response => {
            setItems(response.data)
        })
    }, [])

    // Load Api IBGE with useEffect
    useEffect(() => {
        axios.get<IBGEUFresponse[]>('https://servicodados.ibge.gov.br/api/v1/localidades/estados').then(response => {
            const ufInitials = response.data.map(uf => uf.sigla)
            setUFs(ufInitials)
        })
    }, [])

    useEffect(() => {
        if (selectedUf === "0") {
            return
        }
        axios.get<IBGEcityresponse[]>(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUf}/municipios`).then(response => {
            const cityNames = response.data.map(city => city.nome)
            setCities(cityNames)
        })
    }, [selectedUf])

    function handleSelectUf(event: ChangeEvent<HTMLSelectElement>) {
        const uf = event.target.value
        setselectedUf(uf)
    }

    function handleSelectCity(event: ChangeEvent<HTMLSelectElement>) {
        const city = event.target.value
        setselectedCity(city)
    }

    function handleMapClick(event: LeafletMouseEvent) {
        setSelectedPosition([event.latlng.lat, event.latlng.lng])
    }

    function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
        const { name, value } = event.target
        setFormData({ ...formData, [name]: value })
    }

    function handleSelectItem(id: number) {
        const alreadySelected = selectedItems.findIndex(item => item === id)

        if (alreadySelected >= 0) {
            const filteredItems = selectedItems.filter(item => item !== id)
            setSelectedItems(filteredItems)
        } else {
            setSelectedItems([...selectedItems, id])
        }

    }

    async function handleSubmit(event: FormEvent) {
        event.preventDefault()

        const { name, email, whatsapp } = formData
        const uf = selectedUf
        const city = selectedCity
        const [latitude, longitude] = selectedPosition
        const items = selectedItems

        const data = {
            name,
            email,
            whatsapp,
            uf,
            city,
            latitude,
            longitude,
            items
        }

        await api.post('points', data)

        alert('Ponto de coleta criado!')

        history.push('/')

    }

    return (
        <div id="page-create-point">
            <header>
                <img src={Logo} alt="Ecoleta" />

                <Link to="/">
                    <FiArrowLeft />
                    Voltar para home
                </Link>
            </header>

            <form onSubmit={handleSubmit} >
                <h1>Cadastro do <br /> ponto de coleta</h1>

                <fieldset>
                    <legend>
                        <h2>Dados</h2>
                    </legend>

                    <div className="field">
                        <label htmlFor="name">Nome da entidade</label>
                        <input
                            onChange={handleInputChange}
                            type="text"
                            name="name"
                            id="name"
                        />
                    </div>

                    <div className="field-group">
                        <div className="field">
                            <label htmlFor="email">E-mail</label>
                            <input
                                onChange={handleInputChange}
                                type="email"
                                name="email"
                                id="email"
                            />
                        </div>
                        <div className="field">
                            <label htmlFor="whatsapp">Whatsapp</label>
                            <input
                                onChange={handleInputChange}
                                type="text"
                                name="whatsapp"
                                id="whatsapp"
                            />
                        </div>
                    </div>
                </fieldset>

                <fieldset>
                    <legend>
                        <h2>Endereço</h2>
                        <span>Selecione o endereço no mapa</span>
                    </legend>

                    <Map center={initialPosition} zoom={15} onClick={handleMapClick}>
                        <TileLayer
                            attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                        <Marker position={selectedPosition} />
                    </Map>

                    <div className="field-group">
                        <div className="field">
                            <label htmlFor="uf">Estado (UF)</label>
                            <select

                                name="uf"
                                id="uf"
                                onChange={handleSelectUf}
                                value={selectedUf}>

                                <option value="0">Selecione uma UF</option>
                                {
                                    UFs.map(uf => (
                                        <option key={uf} value={uf}>{uf}</option>
                                    ))
                                }
                            </select>
                        </div>
                        <div className="field">
                            <label htmlFor="city">Cidade</label>
                            <select name="city" id="city" onChange={handleSelectCity} value={selectedCity}>
                                <option value="0">Selecione uma Cidade</option>
                                {
                                    cities.map(city => (
                                        <option key={city} value={city}>{city}</option>
                                    ))
                                }
                            </select>
                        </div>
                    </div>
                </fieldset>

                <fieldset>
                    <legend>
                        <h2>Itens de coleta</h2>
                        <span>Selecione um ou mais itens abaixo</span>
                    </legend>

                    <ul className="items-grid" >

                        {
                            items.map(item => (
                                <li
                                    className={selectedItems.includes(item.id) ? 'selected' : ''}
                                    onClick={() => handleSelectItem(item.id)}
                                    key={item.id} >
                                    <img src={item.image_url} />
                                    <span>{item.title}</span>
                                </li>
                            ))
                        }

                    </ul>

                    <button type="submit" >
                        Cadastrar ponto de coleta
                    </button>
                </fieldset>
            </form>

        </div >
    )
}

export default CreatePoint